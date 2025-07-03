export const encodeSecret = (secret: string) => Buffer.from(secret).toString('base64')
