import { FontWeight } from './Typography.types'

export const getFontFamily = (fontWeight: FontWeight | undefined): string => {
    switch (fontWeight) {
        case 'bold':
            return 'Rubik-Bold'
        case 'medium':
            return 'Rubik-Medium'
        case 'thin':
            return 'Rubik-Light'
        case 'normal':
            return 'Rubik-Regular'
        default:
            return 'Rubik-Regular'
    }
}
