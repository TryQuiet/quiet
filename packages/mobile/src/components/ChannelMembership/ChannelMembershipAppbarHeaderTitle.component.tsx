import React from 'react'
import { View } from 'react-native'
import LockIcon from '../../assets/icons/svg/lock'
import PublicChannelIcon from '../../assets/icons/svg/public-channel'
import { DefaultAppbarTitle } from '../Appbar/DefaultAppbarHeaderTitle.component'
import { ChannelMembershipHeaderTitleProps } from './ChannelMembership.types'
import { Typography } from '../Typography/Typography.component'
import { defaultTheme } from '../../styles/themes/default.theme'
import { ChannelType } from '@quiet/types'

export const ChannelMembershipAppbarHeaderTitle: React.FC<ChannelMembershipHeaderTitleProps> = ({
  title,
  fontSize = 16,
  fontWeight = 'medium',
  channelTitle,
  channelType,
  channelIsPublic,
  membershipCount,
}) => {
  return (
    <View style={{ display: 'flex', flexDirection: 'column', alignContent: 'center', alignItems: 'center' }}>
      <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', alignContent: 'center', gap: 6 }}>
        <DefaultAppbarTitle title={title} fontSize={fontSize} fontWeight={fontWeight} />
        <Typography
          fontSize={fontSize}
          fontWeight={'normal'}
          style={{
            color: defaultTheme.palette.typography.gray50,
          }}
        >
          {membershipCount ?? ''}
        </Typography>
      </View>
      {/* A channel's name earns the subtitle; a DM's does not, because a DM is named by its
          participants and the list below is those same people. So a DM shows no second line at
          all — not the name, and not a glyph, since it is neither public nor private. */}
      {channelType === ChannelType.CHANNEL && (
        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
          {/* The glyph follows the channel's privacy, not its kind: a padlock for a private channel
              and the design's '#' for a public one (Figma PVQ1Kjf6Cq8ng1czuVtvR8, 838:9190). Keying
              it on the kind put a padlock on every public channel. */}
          {(channelIsPublic ?? true) ? (
            <PublicChannelIcon size={16} testID={'channel-membership-public-icon'} />
          ) : (
            <LockIcon fill={true} size={16} testID={'channel-membership-private-icon'} />
          )}
          <Typography fontSize={12}>{channelTitle}</Typography>
        </View>
      )}
    </View>
  )
}
