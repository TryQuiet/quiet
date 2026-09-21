import { FlatList, ListRenderItemInfo, TouchableOpacity, View } from 'react-native'

import { ProfilePhoto } from '../../ProfilePhoto/ProfilePhoto.component'
import { Typography } from '../../Typography/Typography.component'
import { Checkbox } from '../../Checkbox/Checkbox.component'
import { defaultTheme } from '../../../styles/themes/default.theme'
import { SelectableListOption, UpdateChannelMembershipListProps } from './UpdateChannelMembershipList.types'
import { Spinner } from '../../Spinner/Spinner.component'
import { createLogger } from '../../../utils/logger'
import { uniqueId } from 'lodash'
import { SELECTABLE_USER_ROW_HEIGHT } from '../ChannelMembership.types'
import { ProfilePhotoWithBadge } from '../../ProfilePhoto/ProfilePhotoWithBadge.component'
import { ProfilePhotoSize } from '../../ProfilePhoto/ProfilePhoto.types'

const logger = createLogger('UpdateChannelMembershipList')

const HORIZ_ELEM_PADDING = 16

export const UpdateChannelMembershipList: React.FC<UpdateChannelMembershipListProps> = ({
  options,
  setOptions,
  visibleOptionsIndices,
  channelId,
  nonMembers,
  maxVisibleOptions,
}) => {
  // Loading means the candidate list has not arrived yet, which is only true while the caller has
  // given us nothing. Once it has, an empty result — everyone is already in the channel, or the
  // query matched nobody — is an answer, not a reason to keep spinning.
  const loaded = options != null && visibleOptionsIndices != null

  const updateOptionsOnCheck = (option: SelectableListOption) => {
    if (options == null) return
    if (!option.mutable) return
    options[option.index] = {
      ...option,
      selected: !options[option.index].selected,
    }

    setOptions(options.map(option => option))
  }

  const renderItem = (listItem: ListRenderItemInfo<number>) => {
    // @ts-expect-error
    const item = options[listItem.item]
    // we shouldn't hit this but just in case
    if (item == null || item.hide) {
      return <></>
    }

    const labelColor = item.mutable ? defaultTheme.palette.typography.main : defaultTheme.palette.typography.gray50
    const uncheckedColor = item.mutable
      ? defaultTheme.palette.background.gray70
      : defaultTheme.palette.background.gray06
    const checkedColor = item.mutable ? defaultTheme.palette.background.gray70 : defaultTheme.palette.background.gray06
    // The whole row is the press target, per the DM designs — not just the checkbox and the name.
    const label = (
      <View
        style={{
          display: 'flex',
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          alignContent: 'center',
          gap: 16,
          paddingVertical: 11,
        }}
      >
        <ProfilePhotoWithBadge userData={nonMembers[item.id]} size={ProfilePhotoSize.MEDIUM} />
        <Typography fontSize={16} style={{ color: labelColor }}>
          {item.label}
        </Typography>
      </View>
    )
    return (
      <TouchableOpacity
        activeOpacity={item.mutable ? 0.2 : 1}
        disabled={!item.mutable}
        onPress={() => updateOptionsOnCheck(item)}
        testID={`update-channel-membership-list-row-${channelId}-${item.id}`}
      >
        <Checkbox
          label={label}
          testID={`update-channel-membership-list-item-${channelId}-${item.id}`}
          status={item.selected ? 'checked' : 'unchecked'}
          color={checkedColor}
          uncheckedColor={uncheckedColor}
          disabled={!item.mutable}
          onPress={() => updateOptionsOnCheck(item)}
          viewStyle={{ paddingHorizontal: HORIZ_ELEM_PADDING, height: SELECTABLE_USER_ROW_HEIGHT }}
        />
      </TouchableOpacity>
    )
  }

  return (
    <View>
      {!loaded ? (
        <View style={{ paddingVertical: 16 }} testID={`update-channel-membership-list-spinner-${channelId}`}>
          <Spinner description='Loading member list' />
        </View>
      ) : (
        <View>
          {/* "Header heading" from the design library (Figma PVQ1Kjf6Cq8ng1czuVtvR8, 838:9310):
              10/16 medium, upper case, 1pt of tracking, 8pt clear of the first row. */}
          <Typography
            fontSize={10}
            fontWeight={'medium'}
            style={{
              color: defaultTheme.palette.typography.gray50,
              lineHeight: 16,
              letterSpacing: 1,
              paddingHorizontal: HORIZ_ELEM_PADDING,
              paddingBottom: 8,
            }}
            testID={`update-channel-membership-list-header-${channelId}`}
          >
            MEMBERS
          </Typography>
          {visibleOptionsIndices.size > 0 ? (
            <View
              style={{
                // Each row plus the hairline under it, so the window ends on a row boundary.
                // maxHeight, not height: a fixed height cannot give way, and in the new-message
                // composer this list sits above the message input in a column that is already
                // short when the keyboard is up. Fixed, it pushed the input off the screen.
                maxHeight: maxVisibleOptions != null ? (SELECTABLE_USER_ROW_HEIGHT + 1) * maxVisibleOptions : undefined,
                flexShrink: 1,
              }}
            >
              <FlatList
                data={[...visibleOptionsIndices]}
                extraData={{ visibleOptionsIndices, options }}
                keyExtractor={index => (options && options[index].id) ?? `default-id-${uniqueId()}`}
                renderItem={index => renderItem(index)}
                ItemSeparatorComponent={() => {
                  return <View style={{ height: 1, backgroundColor: defaultTheme.palette.background.gray06 }} />
                }}
                style={{ backgroundColor: defaultTheme.palette.background.white }}
                testID={`update-channel-membership-list-${channelId}`}
                scrollEnabled={true}
              />
            </View>
          ) : (
            <Typography
              fontSize={14}
              style={{
                color: defaultTheme.palette.typography.grayDark,
                fontStyle: 'italic',
                paddingHorizontal: HORIZ_ELEM_PADDING,
                paddingVertical: 16,
              }}
              testID={`update-channel-membership-list-nomembers-${channelId}`}
            >
              No members to add
            </Typography>
          )}
          <View style={{ height: 1, backgroundColor: defaultTheme.palette.background.gray06 }} />
        </View>
      )}
    </View>
  )
}
