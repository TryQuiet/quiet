export const mockEvent = (value) => ({ target: { value } })

export const mockClasses = new Proxy({}, { get: (_obj, key) => `${String(key)}-mock` })

export default {
  mockEvent,
  mockClasses
}
