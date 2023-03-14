export const capitalizeFirstLetter = (string: string) => {
  if (string !== undefined && string.length > 0) {
    return string.charAt(0).toUpperCase() + string.slice(1)
  } else {
    return null
  }
}
