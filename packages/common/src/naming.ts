// Removes prepended and appended hyphens, then replaces multiple hyphens with a single hyphen
const trimHyphen = (input: string) => input.replace(/^[\s-]+|[\s-]$/g, '').replace(/(-)\1+/g, '$1')

/* eslint-disable */
export const specialCharsRegex = /[&\/\\#\]\[,+()!@$%^&*=_~`.'":;|?<>{}]/g

export const parseName = (name = '') => {
  const sanitizedName = name.toLowerCase().replace(/ +/g, '-').replace(specialCharsRegex, '')
  return trimHyphen(sanitizedName)
}
