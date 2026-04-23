import React, { useEffect, useRef, useState } from 'react'
import { KeyboardAvoidingView, Platform, TextInput, View } from 'react-native'

import { defaultPalette } from '../../../styles/palettes/default.palette'
import { Appbar } from '../../Appbar/Appbar.component'
import { Button } from '../../Button/Button.component'
import { UpdateChannelMembershipProps } from './UpdateChannelMembership.types'
import { createLogger } from '../../../utils/logger'
import { ChannelMembershipAppbarHeaderTitle } from '../ChannelMembershipAppbarHeaderTitle.component'
import { SelectableListOption } from './UpdateChannelMembershipList.types'
import { UpdateChannelMembershipList } from './UpdateChannelMembershipList.component'
import { Typography } from '../../Typography/Typography.component'
import { defaultTheme } from '../../../styles/themes/default.theme'
import { Input } from '../../Input/Input.component'
import Fuse from 'fuse.js'

const logger = createLogger('ChannelMembership')

const HEADER_TITLE = 'Add members'

export const UpdateChannelMembership: React.FC<UpdateChannelMembershipProps> = ({
  channelName,
  channelId,
  userProfiles,
  community,
  updateChannelMembership,
  handleBackButton,
}) => {
  const [displayedName, setDisplayedName] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [options, setOptions] = useState<SelectableListOption[] | undefined>(undefined)
  const [visibleOptionIndices, setVisibleOptionIndices] = useState<Set<number> | undefined>(undefined)
  const [inputError, setInputError] = useState<string | undefined>(undefined)
  const [membershipSearchInput, setMembershipSearchInput] = useState<string | undefined>(undefined)
  const [fuzzySearch, setFuzzySearch] = useState<Fuse<SelectableListOption> | undefined>(undefined)
  const inputRef = useRef<TextInput>(null)

  const _initializeOptions = () => {
    const initialOptions: SelectableListOption[] = []
    const visibleIndices: Set<number> = new Set()
    let index = 0
    for (const user of Object.values(userProfiles)) {
      let mutable = true
      let selected = false
      let hide = false
      if ((user.channels ?? []).includes(channelId)) {
        mutable = false
        selected = true
        hide = true
      }
      initialOptions.push({ label: user.nickname, id: user.userId, selected, index, mutable, hide })
      if (!hide) {
        visibleIndices.add(index)
      }
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
    updateChannelMembership(
      (options ?? []).filter(option => option.selected && option.mutable).map(option => option.id)
    )
    setOptions([])
    setVisibleOptionIndices(new Set())
    setLoading(false)
  }

  const goBack = () => {
    if (!loading) {
      setOptions(undefined)
      setFuzzySearch(undefined)
      setMembershipSearchInput(undefined)
      setVisibleOptionIndices(undefined)
      setInputError(undefined)
      handleBackButton()
    }
  }

  // Don't loose channel name during store cleanup
  useEffect(() => {
    if (channelName !== '') {
      setDisplayedName(channelName)
    }
  }, [channelName])

  useEffect(() => {
    _initializeOptions()
  }, [userProfiles])

  const _setAllOptionsVisible = (): Set<number> => {
    if (options == null) return new Set()
    return new Set(Array(options.length).keys())
  }

  const _parseFilterText = (rawFilterText: string): string => {
    if (rawFilterText === '@') {
      return ''
    }
    if (rawFilterText.startsWith('@')) {
      return rawFilterText.slice(1)
    }
    return rawFilterText
  }

  const _fuzzyFilterUsers = (filterText: string): Set<number> => {
    if (fuzzySearch == null || options == null) {
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
    const foundIndices = _fuzzyFilterUsers(_parseFilterText(value))
    setVisibleOptionIndices(foundIndices)
  }

  return (
    <View style={{ flex: 1, backgroundColor: defaultPalette.background.white }} testID={'channel-membership-component'}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: 'height' })}
        style={{
          flex: 1,
          marginBottom: 16,
        }}
      >
        <Appbar
          title={HEADER_TITLE}
          titleComponent={<ChannelMembershipAppbarHeaderTitle title={HEADER_TITLE} channelName={displayedName} />}
          back={goBack}
          submit={onPress}
        />
        <View
          style={{
            paddingTop: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 32,
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
            bottomSeparator={<View style={{ height: 1, backgroundColor: defaultTheme.palette.background.gray06 }} />}
            wrapperStyle={{ paddingHorizontal: 16, display: 'flex', flexDirection: 'column' }}
            keyboardType={'email-address'}
            testID={`update-channel-membership-input-${channelId}`}
          />
          <UpdateChannelMembershipList
            options={options}
            visibleOptionsIndices={visibleOptionIndices}
            setOptions={setOptions}
            channelId={channelId}
            userProfiles={userProfiles}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  )
}
