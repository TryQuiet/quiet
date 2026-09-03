import { useEffect, useState } from 'react'
import { FlatList, ListRenderItemInfo, TouchableOpacity, View } from 'react-native'

import { ProfilePhoto } from '../../ProfilePhoto/ProfilePhoto.component'
import { Typography } from '../../Typography/Typography.component'
import { Checkbox } from '../../Checkbox/Checkbox.component'
import { defaultTheme } from '../../../styles/themes/default.theme'
import { SelectableListOption, UpdateChannelMembershipListProps } from './UpdateChannelMembershipList.types'
import { Spinner } from '../../Spinner/Spinner.component'
import { createLogger } from '../../../utils/logger'
import { uniqueId } from 'lodash'

const logger = createLogger('UpdateChannelMembershipList')

const HORIZ_ELEM_PADDING = 16

export const UpdateChannelMembershipList: React.FC<UpdateChannelMembershipListProps> = ({
  options,
  setOptions,
  visibleOptionsIndices,
  channelId,
  userProfiles,
}) => {
  const [hasOptions, setHasOptions] = useState<boolean | undefined>(undefined)
  const updateOptionsOnCheck = (option: SelectableListOption) => {
    if (options == null) return
    if (!option.mutable) return
    options[option.index] = {
      ...option,
      selected: !options[option.index].selected,
    }

    setOptions(options.map(option => option))
  }

  useEffect(() => {
    setHasOptions(
      visibleOptionsIndices == null || Object.values(userProfiles ?? {}).length === 0
        ? undefined
        : visibleOptionsIndices.size > 0
    )
  }, [visibleOptionsIndices, userProfiles])

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
    const label = (
      <TouchableOpacity onPress={() => updateOptionsOnCheck(item)}>
        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            alignContent: 'center',
            gap: 16,
            paddingVertical: 11,
          }}
        >
          <ProfilePhoto
            userId={item.id}
            username={item.label}
            photo={userProfiles[item.id]?.photo}
            profilePhoto={userProfiles[item.id]?.profilePhoto}
            size={32}
            borderRadius={4}
          />
          <Typography fontSize={16} style={{ color: labelColor }}>
            {item.label}
          </Typography>
        </View>
      </TouchableOpacity>
    )
    return (
      <Checkbox
        label={label}
        testID={`update-channel-membership-list-item-${channelId}-${item.id}`}
        status={item.selected ? 'checked' : 'unchecked'}
        color={checkedColor}
        uncheckedColor={uncheckedColor}
        disabled={!item.mutable}
        onPress={() => updateOptionsOnCheck(item)}
        viewStyle={{ paddingHorizontal: HORIZ_ELEM_PADDING }}
      />
    )
  }

  return (
    <View>
      {hasOptions == null || visibleOptionsIndices == null || options == null ? (
        <View style={{ paddingVertical: 16 }} testID={`update-channel-membership-list-spinner-${channelId}`}>
          <Spinner description='Loading member list' />
        </View>
      ) : (
        <View>
          <Typography
            fontSize={10}
            style={{ color: defaultTheme.palette.typography.gray50, paddingHorizontal: 16 }}
            testID={`update-channel-membership-list-header-${channelId}`}
          >
            MEMBERS
          </Typography>
          {hasOptions ? (
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
            />
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
