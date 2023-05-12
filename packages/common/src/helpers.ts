export function isDefined<T>(argument: T | undefined): argument is T {
  // Type guard
  return argument !== undefined
}
