export const getBytesSize = value => {
  return new TextEncoder().encode(value).length
}
