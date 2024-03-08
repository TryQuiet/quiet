export function isDefined<T>(argument: T | undefined): argument is T {
  // Type guard
  return argument !== undefined
}

export function isNotNull<T>(argument: T | null): argument is T {
  // Type guard
  return argument !== null
}

/**
 * Helper function that allows one to use partial-application with a
 * constructor. Given a classname and constructor params, returns a
 * new constructor which can be called like normal (`new x()`).
 */
export function constructPartial(constructor: (...args: any[]) => any, args: any[]) {
  return constructor.bind.apply(constructor, [null, ...args])
}
