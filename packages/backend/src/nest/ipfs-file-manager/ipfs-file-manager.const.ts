export const TRANSFER_SPEED_SPAN = 10
export const UPDATE_STATUS_INTERVAL = 1
export const BLOCK_FETCH_TIMEOUT = 60
/**
 * FIXME: Due to #1684, we've reduced this from 40 to 1 as a quick
 * fix.
 */
export const QUEUE_CONCURRENCY = 1
// Not sure if this is safe enough, nodes with CID data usually contain at most around 270 hashes.
export const MAX_EVENT_LISTENERS = 300
