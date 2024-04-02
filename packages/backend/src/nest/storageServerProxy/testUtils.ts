export const prepareResponse = (responseData: Partial<Response>) => {
  const ok = responseData.status ? responseData.status >= 200 && responseData.status < 300 : false
  const response: Response = {
    headers: new Headers(),
    ok,
    redirected: false,
    status: 200,
    statusText: '',
    type: 'basic',
    url: '',
    clone: function (): Response {
      throw new Error('Function not implemented.')
    },
    body: null,
    bodyUsed: false,
    arrayBuffer: function (): Promise<ArrayBuffer> {
      throw new Error('Function not implemented.')
    },
    blob: function (): Promise<Blob> {
      throw new Error('Function not implemented.')
    },
    formData: function (): Promise<FormData> {
      throw new Error('Function not implemented.')
    },
    json: function (): Promise<any> {
      throw new Error('Function not implemented.')
    },
    text: function (): Promise<string> {
      throw new Error('Function not implemented.')
    },
    ...responseData,
  }
  return response
}
