import { useState } from 'react'
import { FlatList, ListRenderItemInfo, View } from 'react-native'

import { ChannelMembershipListProps, SelectableListOption } from './ChannelMembershipList.types'
import { ProfilePhoto } from '../../ProfilePhoto/ProfilePhoto.component'
import { Typography } from '../../Typography/Typography.component'
import { Checkbox } from '../../Checkbox/Checkbox.component'
import { defaultTheme } from '../../../styles/themes/default.theme'

export const ChannelMembershipList: React.FC<ChannelMembershipListProps> = ({
  options,
  setOptions,
  channelId,
  userProfiles,
}) => {
  const [statusUpdatedTs, setStatusUpdatedTs] = useState<number>(0)
  const updateOptionsOnCheck = (option: SelectableListOption) => {
    if (!option.mutable) return
    options[option.index] = {
      ...option,
      selected: !options[option.index].selected,
    }

    setOptions(options)
    setStatusUpdatedTs(Date.now()) // this just allows us to easily trigger a rerender of the list
  }

  const renderItem = (listItem: ListRenderItemInfo<SelectableListOption>) => {
    const { item } = listItem
    const labelColor = item.mutable ? defaultTheme.palette.typography.main : defaultTheme.palette.typography.gray50
    const label = (
      <View style={{ display: 'flex', flexDirection: 'row', alignContent: 'center', alignItems: 'center', gap: 16 }}>
        <ProfilePhoto
          userId={item.id}
          username={item.label}
          photo={userProfiles[item.id]?.photo}
          profilePhoto={userProfiles[item.id]?.profilePhoto}
        />
        <Typography fontSize={16} style={{ color: labelColor }}>
          {item.label}
        </Typography>
      </View>
    )
    return (
      <Checkbox
        label={label}
        testID={`checkbox-member-checkbox-${channelId}-${item.id}`}
        status={options[item.index].selected ? 'checked' : 'unchecked'}
        disabled={!item.mutable}
        onPress={() => updateOptionsOnCheck(item)}
      />
    )
  }

  return (
    <FlatList
      data={[...options]}
      extraData={{ statusUpdatedTs, userProfiles }}
      keyExtractor={item => item.id}
      renderItem={item => renderItem(item)}
      ItemSeparatorComponent={() => {
        return <View style={{ height: 1, backgroundColor: defaultTheme.palette.background.gray06 }} />
      }}
      style={{ backgroundColor: defaultTheme.palette.background.white }}
      testID={`channel_membership_options_list_${channelId}`}
    />
  )
}
