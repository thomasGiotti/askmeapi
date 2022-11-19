import { AuthenticationError, ForbiddenError } from 'apollo-server-core'
import { Request } from 'express'
import errorHandler from '../controllers/error.controller'
import UserModel, { User } from '../models/user.model'
import redisClient from '../utils/connectRedis'
import { verifyJwt } from '../utils/jwt'

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, consistent-return
const deserializeUser = async (req: Request) => {
  try {
    // Get the access token
    let accessToken
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      // eslint-disable-next-line prefer-destructuring
      accessToken = req.headers.authorization.split(' ')[1]
    } else if (req.cookies?.accessToken) {
      const { accessToken: token } = req.cookies
      accessToken = token
    }

    if (!accessToken) throw new AuthenticationError('No access token found')

    // Validate the Access token
    const decoded = verifyJwt<{ userId: string }>(accessToken, 'accessTokenPublicKey')

    if (!decoded) throw new AuthenticationError('Invalid access token')

    // Check if the session is valid
    const session = await redisClient.get(decoded.userId)

    if (!session) throw new ForbiddenError('Session has expired')

    const user = await UserModel.findById(JSON.parse(session).id).select('+verified')

    if (!user || !user.verified) {
      throw new ForbiddenError('The user belonging to this token no logger exist')
    }

    return user
  } catch (error: any) {
    errorHandler(error)
  }
}

export default deserializeUser
