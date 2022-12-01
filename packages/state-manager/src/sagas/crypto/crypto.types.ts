export interface CryptoServicePayload {
  id: string
  method: string
  args: string[]
}

export interface CryptoServiceResponse {
  id: string
  value: any
}
