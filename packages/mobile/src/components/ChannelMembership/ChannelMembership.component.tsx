import React, { useEffect, useRef, useState } from 'react'
import { KeyboardAvoidingView, TextInput, View } from 'react-native'

import { defaultPalette } from '../../styles/palettes/default.palette'
import { Appbar } from '../Appbar/Appbar.component'
import { Button } from '../Button/Button.component'
import { ChannelMembershipProps } from './ChannelMembership.types'
import { createLogger } from '../../utils/logger'
import { ChannelMembershipAppbarHeaderTitle } from './ChannelMembershipAppbarHeaderTitle.component'
import { SelectableListOption } from './ChannelMembershipList/ChannelMembershipList.types'
import { ChannelMembershipList } from './ChannelMembershipList/ChannelMembershipList.component'
import { Typography } from '../Typography/Typography.component'
import { defaultTheme } from '../../styles/themes/default.theme'
import { Input } from '../Input/Input.component'
import Fuse from 'fuse.js'

const logger = createLogger('ChannelMembership')

export const ChannelMembership: React.FC<ChannelMembershipProps> = ({
  channelName,
  channelId,
  userProfiles = {},
  community,
  updateChannelMembership,
  handleBackButton,
}) => {
  const [displayedName, setDisplayedName] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [options, setOptions] = useState<SelectableListOption[]>([])
  const [visibleOptionIndices, setVisibleOptionIndices] = useState<Set<number>>(new Set())
  const [inputError, setInputError] = useState<string | undefined>()
  const [membershipSearchInput, setMembershipSearchInput] = useState<string | undefined>()
  const [fuzzySearch, setFuzzySearch] = useState<Fuse<SelectableListOption> | undefined>()
  const inputRef = useRef<TextInput>(null)

  const _initializeOptions = () => {
    const initialOptions: SelectableListOption[] = []
    const visibleIndices: Set<number> = new Set()
    let index = 0
    for (const user of Object.values(userProfiles)) {
      let mutable = true
      let selected = false
      if ((user.channels ?? []).includes(channelId)) {
        mutable = false
        selected = true
      }
      initialOptions.push({ label: user.nickname, id: user.userId, selected, index, mutable, hide: false })
      visibleIndices.add(index)
      index++
    }
    setOptions(initialOptions)
    setVisibleOptionIndices(visibleIndices)
    setFuzzySearch(
      new Fuse(initialOptions, {
        keys: ['label'],
        minMatchCharLength: 1,
        ignoreDiacritics: true,
        threshold: 0.3,
      })
    )
  }

  const onPress = () => {
    setLoading(true)
    updateChannelMembership(options.filter(option => option.selected && option.mutable).map(option => option.id))
    setOptions([])
    setVisibleOptionIndices(new Set())
  }

  const goBack = () => {
    if (!loading) {
      setOptions([])
      handleBackButton()
    }
  }

  // Don't loose channel name during store cleanup
  useEffect(() => {
    if (channelName !== '') {
      setDisplayedName(channelName)
      _initializeOptions()
    }
  }, [channelName])

  const _setAllOptionsVisible = () => {
    return new Set(Array(options.length).keys())
  }

  const _fuzzyFilterUsers = (filterText: string): Set<number> => {
    if (fuzzySearch == null) {
      return _setAllOptionsVisible()
    }
    const searchResults = fuzzySearch.search(filterText)
    return new Set(searchResults.map(result => result.item.index))
  }

  const onChangeText = (value: string) => {
    setInputError(undefined)
    setMembershipSearchInput(value)
    if (value === '') {
      setVisibleOptionIndices(_setAllOptionsVisible())
      return
    }
    const foundIndices = _fuzzyFilterUsers(value)
    setVisibleOptionIndices(foundIndices)
  }

  return (
    <View style={{ flex: 1, backgroundColor: defaultPalette.background.white }} testID={'channel-membership-component'}>
      <KeyboardAvoidingView
        behavior='height'
        style={{
          flex: 1,
          marginTop: 24,
          paddingLeft: 20,
          paddingRight: 20,
          marginBottom: 16,
        }}
      >
        <Appbar
          title={'Add members'}
          titleComponent={<ChannelMembershipAppbarHeaderTitle title={'Add members'} channelName={displayedName} />}
          back={goBack}
        />
        <View
          style={{
            padding: 24,
          }}
        >
          <Input
            onChangeText={onChangeText}
            subtitle={`Add members with '@'`}
            placeholder={'E.g. @jane123'}
            value={membershipSearchInput}
            length={20}
            disabled={loading}
            validation={inputError}
            ref={inputRef}
            autoCorrect={false}
          />
          <Typography fontSize={10} style={{ paddingTop: 18, color: defaultTheme.palette.typography.gray50 }}>
            MEMBERS
          </Typography>
          <ChannelMembershipList
            options={options}
            visibleOptionsIndices={visibleOptionIndices}
            setOptions={setOptions}
            channelId={channelId}
            userProfiles={userProfiles}
          />
          <View style={{ paddingTop: 16 + 12 }}>
            <Button title={'Update Channel Membership'} onPress={onPress} loading={loading} />
          </View>
          <View style={{ paddingTop: 24 }}>
            <Button title={'Never mind'} onPress={goBack} negative />
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  )
}
