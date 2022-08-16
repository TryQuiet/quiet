export const truncateWords = (str: string, num: number): string => {
  if (str.length > num) {
    return str.split(' ').splice(0, num).join(' ') + '...'
  } else {
    return str
  }
}
