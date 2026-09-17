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
import { useDispatch } from 'react-redux'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { ScreenNames } from '../../const/ScreenNames.enum'
import { ChannelType } from '@quiet/types'

const logger = createLogger('ChannelMembership')

/**
 * One screen, one name, reached from the single membership row in the channel menu.
 *
 * It is editable for an admin on a non-DM channel — it offers Add members — and read-only for
 * everyone else, including in every DM, whose membership is fixed at creation (the participant
 * list is baked into the conversation id). What differs between the two is the button, not the
 * title: a screen that renames itself depending on who is looking is harder to talk about.
 *
 * The design calls the editable form "Permissions" (Figma PVQ1Kjf6Cq8ng1czuVtvR8, 838:9190)
 * because there it governs roles as well as people. WHEN ROLES SHIP, take that name back.
 */
const MEMBERSHIP_TITLE = 'Members'

export const ChannelMembership: React.FC<ChannelMembershipProps> = ({
  channelTitle,
  channelName,
  channelId,
  channelType,
  channelIsPublic,
  community,
  members,
  memberCount,
  canAddMembers,
  handleBackButton,
  openUserProfile,
}) => {
  const dispatch = useDispatch()
  const [displayedName, setDisplayedName] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const mutableMembership = canAddMembers && channelType !== ChannelType.DM

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
          channelIsPublic,
        },
      })
    )
  }, [dispatch, channelTitle, channelId, channelIsPublic])

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
          title={MEMBERSHIP_TITLE}
          titleComponent={
            <ChannelMembershipAppbarHeaderTitle
              title={MEMBERSHIP_TITLE}
              channelTitle={displayedName}
              channelType={channelType}
              channelIsPublic={channelIsPublic}
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
                  newDesign
                  testID={`channel-membership-component-add-members-${channelId}`}
                />
              </View>
              <View style={{ height: 1, backgroundColor: defaultTheme.palette.background.gray06 }} />
            </View>
          )}
          <ChannelMembershipList members={members} channelId={channelId} openUserProfile={openUserProfile} />
        </View>
      </KeyboardAvoidingView>
    </View>
  )
}
