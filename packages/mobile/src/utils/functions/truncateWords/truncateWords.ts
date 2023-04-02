export const truncateWords = (str: string, num: number): string => {
  if (str.split(' ').length > num) {
    return str.split(' ').splice(0, num).join(' ') + '...'
  } else if (str.length > 100) {
    return str.slice(0, 100) + '...'
  } else {
    return str
  }
}
