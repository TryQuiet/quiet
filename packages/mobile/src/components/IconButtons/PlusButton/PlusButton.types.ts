export interface PlusButtonProps {
  onPress: () => void
  /** Required: the glyph carries no text, so this is the only thing a screen reader can announce. */
  accessibilityLabel: string
  iconColor?: string
  size?: number
}
