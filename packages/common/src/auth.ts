export const encodeSecret = (secret: string) => Buffer.from(secret).toString('base64')

export const verifyToken = (secret: string, token: string): boolean => {
  const decoded = Buffer.from(token, 'base64').toString('ascii')
  return decoded === secret
}
