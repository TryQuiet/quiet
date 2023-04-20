export const capitalizeFirstLetter = (text: string) => {
  if (text?.length > 0) {
    return text.charAt(0).toUpperCase() + text.slice(1)
  } else {
    return null
  }
}
