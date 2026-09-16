import React, { useCallback, useEffect, useState } from 'react'
import { KeyboardAvoidingView, Platform, View } from 'react-native'

import { defaultPalette } from '../../styles/palettes/default.palette'
import { Appbar } from '../Appbar/Appbar.component'
import { Button } from '../Button/Button.component'
import { ChannelMembershipProps } from './ChannelMembership.types'
import { createLogger } from '../../utils/logger'
import { ChannelMembershipAppbarHeaderTitle } from './ChannelMembershipAppbarHeaderTitle.component'
import { ChannelMembershipList } from './ChannelMembershipList.component'
import { defaultTheme } from '../../styles/themes/default.theme'
import { useDispatch, useSelector } from 'react-redux'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { ScreenNames } from '../../const/ScreenNames.enum'
import { publicChannels } from '@quiet/state-manager'
import { ChannelType } from '@quiet/types'

const logger = createLogger('ChannelMembership')

/**
 * One screen serves two surfaces, reached from the same side-nav entry.
 *
 * "Permissions" is shown when the viewer can change who belongs to the channel — an admin on a
 * non-DM channel — and the screen is editable: it offers Add members.
 *
 * "Members" is shown otherwise, including for every DM, and the screen is read-only. DM membership
 * is fixed at creation (the participant list is baked into the conversation id), so there is
 * deliberately nothing to edit there.
 *
 * The count beside the title is the member count in both cases; the design library shows the same
 * pattern ("Permissions" with a count, Figma 5058:13948), where the surrounding "Roles and members"
 * frame supplies the context this single line does not.
 */
const MODIFIABLE_MEMBERSHIP_TITLE = 'Permissions'
const NON_MODIFIABLE_MEMBERSHIP_TITLE = 'Members'

export const ChannelMembership: React.FC<ChannelMembershipProps> = ({
  channelTitle,
  channelName,
  channelId,
  channelType,
  community,
  members,
  memberCount,
  canAddMembers,
  handleBackButton,
}) => {
  const dispatch = useDispatch()
  const [displayedName, setDisplayedName] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [headerTitle, setHeaderTitle] = useState<string>('')
  const mutableMembership = canAddMembers && channelType !== ChannelType.DM

  const channel = useSelector(publicChannels.selectors.currentChannel)

  const onPress = useCallback(() => {
    setLoading(true)
    dispatch(
      // Push rather than replace: replacing dropped this screen from the stack, so going back from
      // Add members had nothing to return to and fell through to the home screen.
      navigationActions.navigation({
        screen: ScreenNames.UpdateChannelMembershipScreen,
        params: {
          channelTitle,
          channelName,
          channelId,
          channelType,
        },
      })
    )
  }, [dispatch, channelTitle, channelId])

  const goBack = () => {
    if (!loading) {
      handleBackButton()
    }
  }

  // Don't loose channel name during store cleanup
  useEffect(() => {
    if (channelTitle !== '') {
      setDisplayedName(channelTitle)
    }
  }, [channelTitle])

  useEffect(() => {
    setHeaderTitle(mutableMembership ? MODIFIABLE_MEMBERSHIP_TITLE : NON_MODIFIABLE_MEMBERSHIP_TITLE)
  }, [mutableMembership])

  return (
    <View
      style={{ flex: 1, backgroundColor: defaultPalette.background.white }}
      testID={`channel-membership-component-${channelId}`}
    >
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: 'height' })}
        style={{
          flex: 1,
          marginBottom: 16,
        }}
      >
        <Appbar
          title={headerTitle}
          titleComponent={
            <ChannelMembershipAppbarHeaderTitle
              title={headerTitle}
              channelTitle={displayedName}
              channelType={channelType}
              membershipCount={memberCount}
            />
          }
          back={goBack}
        />
        <View
          style={{
            paddingTop: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 32,
          }}
        >
          {mutableMembership && (
            <View>
              <View
                style={{
                  width: 'auto',
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'flex-end',
                  alignSelf: 'flex-end',
                  paddingHorizontal: 16,
                  paddingBottom: 16,
                }}
              >
                <Button
                  title={'Add members'}
                  onPress={onPress}
                  testID={`channel-membership-component-add-members-${channelId}`}
                />
              </View>
              <View style={{ height: 1, backgroundColor: defaultTheme.palette.background.gray06 }} />
            </View>
          )}
          <ChannelMembershipList members={members} channelId={channelId} />
        </View>
      </KeyboardAvoidingView>
    </View>
  )
}
