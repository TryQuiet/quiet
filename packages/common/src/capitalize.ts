export const capitalizeFirstLetter = (text: string): string => {
  if (text) {
    return text.charAt(0).toUpperCase() + text.slice(1)
  } else {
    return null
  }
}
