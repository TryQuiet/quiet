export enum INPUT_STATE {
  NOT_CONNECTED = 0,
  AVAILABLE = 1,
  ERROR = -1,
  /** There is nowhere to send yet — a new DM with no recipient chosen. */
  NOT_AVAILABLE = 2,
}
