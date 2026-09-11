/** Strict, bounded decoding for the byte representations used by OrbitDB and JSON relays. */
export function decodeWireBytes(value: unknown, maximum: number): Uint8Array {
  const invalid = () => {
    throw new Error('Invalid encoded bytes')
  }
  let bytes: Uint8Array
  if (value instanceof Uint8Array) bytes = value
  else if (typeof value === 'string') {
    if (value.length > maximum * 2 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value))
      invalid()
    bytes = Buffer.from(value, 'base64')
  } else if (value && typeof value === 'object') {
    if (!Array.isArray(value) && (value as any).type === 'Buffer') {
      if (Object.keys(value).length !== 2 || !Array.isArray((value as any).data)) invalid()
      return decodeWireBytes((value as any).data, maximum)
    }
    const keys = Object.keys(value)
    if (keys.length === 0 || keys.length > maximum || keys.some((key, i) => key !== String(i))) invalid()
    if (Array.isArray(value) && value.length !== keys.length) invalid()
    // Check every index before allocating. Object enumeration must not choose a different byte order.
    const values = keys.map((_, i) => (value as any)[i])
    if (values.some(byte => !Number.isInteger(byte) || byte < 0 || byte > 255)) invalid()
    bytes = Uint8Array.from(values)
  } else return invalid()
  if (bytes.length === 0 || bytes.length > maximum) invalid()
  return bytes
}
