/**
 * @description Utility function for plop generator. `function` keyword is necessary to get `name` attribute.
 */
export function toPascalCase(string: string): string {
  return string
    .replace(/[_-]+/gu, ' ')
    .replace(/[^\s\w]/gu, '')
    .replace(
      /\s+(.)(\w+)/gu,
      (_string, firstLetter: string, rest: string) =>
        `${firstLetter.toUpperCase() + rest.toLowerCase()}`,
    )
    .replace(/\s/u, '')
    .replace(/\w/u, s => s.toUpperCase());
}
