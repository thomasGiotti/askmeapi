import jwt, { SignOptions } from 'jsonwebtoken'
import config from 'config'

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const signJwt = (
  // eslint-disable-next-line @typescript-eslint/ban-types
  payload: Object,
  keyName: 'accessTokenPrivateKey' | 'refreshTokenPrivateKey',
  options?: SignOptions
) => {
  const privateKey = Buffer.from(config.get<string>(keyName), 'base64').toString('ascii')

  return jwt.sign(payload, privateKey, {
    ...(options && options),
    algorithm: 'RS256',
  })
}

export const verifyJwt = <T>(
  token: string,
  keyName: 'accessTokenPublicKey' | 'refreshTokenPublicKey'
): T | null => {
  const publicKey = Buffer.from(config.get<string>(keyName), 'base64').toString('ascii')

  try {
    return jwt.verify(token, publicKey, {
      algorithms: ['RS256'],
    }) as T
  } catch (error) {
    return null
  }
}
