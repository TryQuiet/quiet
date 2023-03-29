import React from 'react'
import { useSelector } from 'react-redux'
import { communities } from '@quiet/state-manager'

import { QRCodeComponent } from './QRCode.component'

export const QRCode: React.FC = () => {
  const community = useSelector(communities.selectors.currentCommunity)
  const invitationLink =
    `https://tryquiet.org/join?code=${community?.registrarUrl}` || 'https://tryquiet.org/'

  return <QRCodeComponent value={invitationLink} />
}
