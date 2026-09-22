import React, { FC } from 'react'
import { ScrollView, View } from 'react-native'

import { defaultTheme } from '../../styles/themes/default.theme'
import { spacing } from '../../styles/const/spacing'
import { ChannelPrivateIcon, ChannelPublicIcon, PersonAddSmallIcon } from '../../assets/icons/svg/community-home-icons'
import { Spinner } from '../Spinner/Spinner.component'
import { CommunityAppbar } from './CommunityAppbar.component'
import { ListRow } from './ListRow.component'
import { ListSectionTitle } from './ListSectionTitle.component'
import { PersonRow } from './PersonRow.component'

import type { CommunityHomeProps } from './CommunityHome.types'

/** Radius of the card's top corners, where it meets the purple bar. */
const CARD_RADIUS = 16

/**
 * Community home — the screen the app opens on once you are in a community
 * (Figma: Quiet Design Library 0j7Nna9zWmfOSNmRmQK1Uh, Structure & Nav,
 * `Community home` 5446:76594, variant "Mode=Light, Content=For V1 2025").
 *
 * A brand-purple title bar over a white card with rounded top corners. The bar
 * does not extend behind the status bar: the app's root safe area owns that
 * strip and paints it white, and at targetSdk 36 Android ignores
 * `StatusBar backgroundColor` anyway. Colouring it purple needs an edge-to-edge
 * change in App.tsx, which is out of this screen's scope.
 *
 * The card holds the Add members row, the Channels section and the community's
 * members. Rows carry no message preview: the mobile design is a navigation
 * list, not an inbox.
 *
 * The last section keeps the frame's own heading, "Direct messages", over the
 * people the frame draws under it: the community's members. Quiet has direct
 * messages now, so a member row is no longer inert — tapping one opens the
 * conversation with that person, or starts it.
 */
export const CommunityHome: FC<CommunityHomeProps> = ({
  communityName,
  channels,
  users,
  canCreateChannel,
  openCommunityMenu,
  addMembers,
  createChannel,
  openChannel,
  openMember,
}) => {
  const loading = channels.length === 0
  const unread = channels.some(channel => channel.unread)

  return (
    <View style={{ flex: 1, backgroundColor: defaultTheme.palette.main.brand }} testID={'channel-list-component'}>
      <CommunityAppbar communityName={communityName} unread={unread} onPress={openCommunityMenu} />
      <View
        style={{
          flex: 1,
          marginTop: spacing.xs,
          borderTopLeftRadius: CARD_RADIUS,
          borderTopRightRadius: CARD_RADIUS,
          overflow: 'hidden',
          backgroundColor: defaultTheme.palette.background.white,
        }}
      >
        {loading ? (
          <Spinner description='Connecting to peers' />
        ) : (
          <ScrollView
            testID={'channels_list'}
            contentContainerStyle={{ paddingTop: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.xxl }}
          >
            <View>
              <ListRow label='Add members' icon={<PersonAddSmallIcon />} onPress={addMembers} testID={'Add members'} />
            </View>

            <View>
              <ListSectionTitle
                title='Channels'
                testID={'channels_section'}
                onAdd={canCreateChannel ? createChannel : undefined}
                addTestID={'Create channel'}
                addAccessibilityLabel='Create channel'
              />
              {channels.map(channel => (
                <ListRow
                  key={channel.id}
                  label={channel.name}
                  icon={channel.isPublic ? <ChannelPublicIcon /> : <ChannelPrivateIcon />}
                  unread={channel.unread}
                  onPress={() => openChannel(channel.id)}
                  testID={`channel_tile_${channel.name}`}
                  accessibilityLabel={`${channel.name}, ${channel.isPublic ? 'public' : 'private'} channel`}
                />
              ))}
            </View>

            {/* The empty community (6124:9816) draws no member section at all. */}
            {users.length > 0 && (
              <View>
                <ListSectionTitle title='Direct messages' testID={'members_section'} />
                {users.map(user => (
                  <PersonRow
                    key={user.userId}
                    user={user}
                    onPress={() => openMember(user.userId)}
                    testID={`user_tile_${user.nickname}`}
                  />
                ))}
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </View>
  )
}
