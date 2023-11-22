export function isDefined<T>(argument: T | undefined): argument is T {
    // Type guard
    return argument !== undefined
}

export function isNotNull<T>(argument: T | null): argument is T {
    // Type guard
    return argument !== null
}
