export const mockEvent = (value) => ({ target: { value } })

export const mockClasses = new Proxy({}, { get: (obj, key) => `${key}-mock` })

export default {
  mockEvent,
  mockClasses
}
