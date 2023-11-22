import React from 'react'
import { useSelector } from 'react-redux'
import { communities } from '@quiet/state-manager'

import { QRCodeComponent } from './QRCode.component'
import { Site } from '@quiet/common'

export const QRCode: React.FC = () => {
    const invitationLink = useSelector(communities.selectors.invitationUrl) || Site.MAIN_PAGE
    return <QRCodeComponent value={invitationLink} />
}
