import { sign, verify } from 'jsonwebtoken'

interface JwtPayload {
  appName: string
}

const SECRET = 'secret' //temporary
const APP_NAME = 'Quiet'

export const generateJWT = () => {
  return sign({ appName: APP_NAME }, SECRET, { algorithm: 'HS256' })
}

export const verifyJWT = (token: string): boolean => {
  const isVerify = verify(token, SECRET) as JwtPayload
  return isVerify.appName === APP_NAME ? true : false
}
