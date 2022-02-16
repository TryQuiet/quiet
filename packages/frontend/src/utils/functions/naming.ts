const trimHyphen = (input: string, allowTrailingHyphen: boolean): string => {
  while (input.charAt(0) === '-' || input.charAt(0) === ' ') {
    input = input.substring(1)
  }

  if (allowTrailingHyphen) {
    // Allow only one hyphen at the end of the inserted value
    while (
      (input.charAt(input.length - 1) === '-' || input.charAt(input.length - 1) === ' ') &&
      (input.charAt(input.length - 2) === '-' || input.charAt(input.length - 2) === ' ')
    ) {
      input = input.substring(0, input.length - 1)
    }
  } else {
    while (input.charAt(input.length - 1) === '-' || input.charAt(input.length - 1) === ' ') {
      input = input.substring(0, input.length - 1)
    }
  }

  return input
}

export const parseName = (name = '', submitted: boolean = false) => {
  const trimmedName = trimHyphen(name, !submitted)
  return trimmedName.toLowerCase().replace(/ +/g, '-')
}
