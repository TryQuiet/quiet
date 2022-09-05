const trimHyphen = (input: string): string => {
  while (input.charAt(0) === '-' || input.charAt(0) === ' ') {
    input = input.substring(1)
  }

  while (input.charAt(input.length - 1) === '-' || input.charAt(input.length - 1) === ' ') {
    input = input.substring(0, input.length - 1)
  }

  // Remove double hyphens
  input = input.replace(/(-)\1+/g, '$1')

  return input
}

/* eslint-disable */
export const specialCharsRegex = /[&\/\\#\]\[,+()!@$%^&*=_~`.'":;|?<>{}]/g

export const parseName = (name = '') => {
  const trimmedName = trimHyphen(name)
  return trimmedName.toLowerCase().replace(/ +/g, '-').replace(specialCharsRegex, '')
}
