export interface ActionProgressProps {
  /** The status line, verbatim from the design where there is one. */
  status: string
  /** The optional second line under the status (Additional info, 5390:19573). */
  secondary?: string
  /** How far along, 0 to 1, for an action that reports real phases; omitted, the fill sweeps instead. */
  value?: number
  testID?: string
}
