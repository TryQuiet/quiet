import React, { FC } from 'react'

import { DisplayQrCode } from '../../../Onboarding/DisplayQrCode'

/**
 * Settings → Linked devices → Display QR code: the device link as a QR code, in the panel like
 * the invite QR code under QR Code (#3690). The panel scrolls, so nothing is cut off on a short
 * window. `DisplayQrCode` mints the link when there is none.
 */
export const LinkedDevicesQrCode: FC = () => <DisplayQrCode dataTestId='link-devices-display' />

export default LinkedDevicesQrCode
