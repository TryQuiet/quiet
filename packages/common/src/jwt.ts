import { sign, verify } from 'jsonwebtoken'

interface JwtPayload {
  appName: string
}

const APP_NAME = 'Quiet'

export const generateSecret = () => Math.floor(Math.random() * 100 ** 10).toString()

export const generateJWT = (secret: string) => {
  return sign({ appName: APP_NAME }, secret, { algorithm: 'HS256' })
}

export const verifyJWT = (token: string, secret: string): boolean => {
  const isVerify = verify(token, secret) as JwtPayload
  return isVerify.appName === APP_NAME ? true : false
}
