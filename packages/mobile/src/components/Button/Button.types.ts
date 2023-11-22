export interface ButtonProps {
    onPress: () => void
    title: string
    width?: number
    loading?: boolean
    negative?: boolean
    disabled?: boolean
}
