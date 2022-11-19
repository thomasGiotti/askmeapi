/* eslint-disable consistent-return */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable class-methods-use-this */
import { AuthenticationError, ForbiddenError, ValidationError } from 'apollo-server-core'
import config from 'config'
import { CookieOptions } from 'express'
import errorHandler from '../controllers/error.controller'
import deserializeUser from '../middleware/deserializeUser'
import UserModel, { User } from '../models/user.model'
import { LoginInput } from '../schemas/user.schema'
import { Context } from '../types/context'
import redisClient from '../utils/connectRedis'
import { signJwt, verifyJwt } from '../utils/jwt'

const accessTokenExpiresIn = config.get<number>('accessTokenExpiresIn')
const refreshTokenExpiresIn = config.get<number>('refreshTokenExpiresIn')

const cookieOptions: CookieOptions = {
  httpOnly: true,
  // domain: 'localhost',
  sameSite: 'none',
  secure: true,
}

const accessTokenCookieOptions = {
  ...cookieOptions,
  maxAge: accessTokenExpiresIn * 60 * 1000,
  expires: new Date(Date.now() + accessTokenExpiresIn * 60 * 1000),
}

const refreshTokenCookieOptions = {
  ...cookieOptions,
  maxAge: refreshTokenExpiresIn * 60 * 1000,
  expires: new Date(Date.now() + refreshTokenExpiresIn * 60 * 1000),
}

if (process.env.NODE_ENV === 'production') cookieOptions.secure = true

async function findByEmail(email: string): Promise<User | null> {
  return UserModel.findOne({ email }).select('+password')
}

function signTokens(user: User) {
  const userId: string = user.id.toString()
  const accessToken = signJwt({ userId }, 'accessTokenPrivateKey', {
    expiresIn: `${accessTokenExpiresIn}m`,
  })

  const refreshToken = signJwt({ userId }, 'refreshTokenPrivateKey', {
    expiresIn: `${refreshTokenExpiresIn}m`,
  })

  redisClient.set(userId, JSON.stringify(user), {
    EX: refreshTokenExpiresIn * 60,
  })

  return { accessToken, refreshToken }
}

export default class UserService {
  // Register User
  signUpUser = async (input: Partial<User>) => {
    try {
      const user = await UserModel.create(input)
      return {
        status: 'success',
        user,
      }
    } catch (error: any) {
      if (error.code === 11000) return new ValidationError('Email already exists')
      errorHandler(error)
    }
  }

  loginUser = async (input: LoginInput, { res }: Context) => {
    try {
      const message = 'Invalid email or password'
      // 1. Find user by email
      const user = await findByEmail(input.email)

      if (!user) {
        return new AuthenticationError(message)
      }

      // 2. Compare passwords
      if (!(await UserModel.comparePasswords(user.password, input.password))) {
        return new AuthenticationError(message)
      }

      // 3. Sign JWT Tokens
      const { accessToken, refreshToken } = signTokens(user)

      // 4. Add Tokens to Context
      res.cookie('accessToken', accessToken, accessTokenCookieOptions)
      res.cookie('refreshToken', refreshToken, refreshTokenCookieOptions)
      res.cookie('loggedIn', 'true', {
        ...accessTokenCookieOptions,
        httpOnly: false,
      })

      return {
        status: 'success',
        accessToken,
      }
    } catch (error: any) {
      errorHandler(error)
    }
  }

  getMe = async ({
    req,
    res,
    // eslint-disable-next-line no-shadow
    deserializeUser,
  }: Context): Promise<{ status: string; user: any } | undefined> => {
    try {
      const user = await deserializeUser(req)
      return {
        status: 'success',
        user,
      }
    } catch (error: any) {
      errorHandler(error)
    }
  }

  refreshAccessToken = async ({ req, res }: Context) => {
    try {
      // Get the refresh token
      const { refreshToken } = req.cookies

      // Validate the RefreshToken
      const decoded = verifyJwt<{ userId: string }>(refreshToken, 'refreshTokenPublicKey')

      if (!decoded) {
        throw new ForbiddenError('Could not refresh access token')
      }

      // Check if user's session is valid
      const session = await redisClient.get(decoded.userId)

      if (!session) {
        throw new ForbiddenError('User session has expired')
      }

      // Check if user exist and is verified
      const user = await UserModel.findById(JSON.parse(session).id).select('+verified')

      if (!user || !user.verified) {
        throw new ForbiddenError('Could not refresh access token')
      }

      // Sign new access token
      const accessToken = signJwt({ userId: user.id }, 'accessTokenPrivateKey', {
        expiresIn: `${accessTokenExpiresIn}m`,
      })

      // Send access token cookie
      res.cookie('accessToken', accessToken, accessTokenCookieOptions)
      res.cookie('loggedIn', 'true', {
        ...accessTokenCookieOptions,
        httpOnly: false,
      })

      return {
        status: 'success',
        accessToken,
      }
    } catch (error) {
      errorHandler(error)
    }
  }

  logoutUser = async ({ req, res }: Context) => {
    try {
      const user = await deserializeUser(req)

      // Delete the user's session
      await redisClient.del(String(user?.id))

      // Logout user
      res.cookie('accessToken', '', { maxAge: -1 })
      res.cookie('refreIhToken', '', { maxAge: -1 })
      res.cookie('loggedIn', '', { maxAge: -1 })

      return true
    } catch (error) {
      errorHandler(error)
    }
  }
}
