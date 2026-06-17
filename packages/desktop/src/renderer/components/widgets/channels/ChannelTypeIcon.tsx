import React from 'react'
import { SvgIconProps } from '@mui/material'
import LockIcon from '../../../static/images/components/lock'
import PublicChannelIcon from '../../../static/images/components/public-channel'

export interface ChannelTypeIconProps extends SvgIconProps {
  isPublic?: boolean
}

const ChannelTypeIcon: React.FC<ChannelTypeIconProps> = ({ isPublic = true, ...props }) => {
  return isPublic ? <PublicChannelIcon {...props} /> : <LockIcon {...props} />
}

export default ChannelTypeIcon
