/**
 * Parses a name, replacing special characters with a hyphen
 * @param name string to be parsed
 * @returns string with special characters replaced with a hyphen
 */
export const parseName = (name = '') => {
  return name.replace(/[^\w._-]/g, '-').toLowerCase()
}
