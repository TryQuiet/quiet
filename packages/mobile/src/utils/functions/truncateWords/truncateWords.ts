export const truncateWords = (str: string, wordCount: number, charCount: number): string => {
    if (str.split(' ').length > wordCount) {
        return str.split(' ').splice(0, wordCount).join(' ') + '...'
    } else if (str.length > charCount) {
        return str.slice(0, charCount) + '...'
    } else {
        return str
    }
}
