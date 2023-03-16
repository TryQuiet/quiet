export const truncateWords = (str: string, num: number): string => {
  if (str.split(' ').length > num) {
    return str.split(' ').splice(0, num).join(' ') + '...'
  } else {
    return str
  }
}
