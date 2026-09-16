import React, { useEffect, useRef, useState } from 'react'
import { KeyboardAvoidingView, Platform, TextInput, TouchableOpacity, View } from 'react-native'

import { defaultPalette } from '../../../styles/palettes/default.palette'
import { Appbar } from '../../Appbar/Appbar.component'
import { UpdateChannelMembershipProps } from './UpdateChannelMembership.types'
import { createLogger } from '../../../utils/logger'
import { ChannelMembershipAppbarHeaderTitle } from '../ChannelMembershipAppbarHeaderTitle.component'
import { SelectableListOption } from './UpdateChannelMembershipList.types'
import { UpdateChannelMembershipList } from './UpdateChannelMembershipList.component'
import { defaultTheme } from '../../../styles/themes/default.theme'
import { Input } from '../../Input/Input.component'
import { Typography } from '../../Typography/Typography.component'
import Fuse from 'fuse.js'

const logger = createLogger('ChannelMembership')

const HEADER_TITLE = 'Add members'
// Copy taken from the DM designs (Figma: Direct Messages (DMs), "Pre search" 823:14606).
const SEARCH_PLACEHOLDER = 'Search for people, chats or channels'

export const UpdateChannelMembership: React.FC<UpdateChannelMembershipProps> = ({
  channelTitle,
  channelName,
  channelId,
  channelType,
  nonMembers,
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
    for (const userData of Object.values(nonMembers)) {
      let mutable = true
      let selected = false
      let hide = false
      if ((userData.user.channels ?? []).includes(channelId)) {
        mutable = false
        selected = true
        hide = true
      }
      initialOptions.push({ label: userData.user.nickname, id: userData.user.userId, selected, index, mutable, hide })
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
    if (channelTitle !== '') {
      setDisplayedName(channelTitle)
    }
  }, [channelTitle])

  useEffect(() => {
    _initializeOptions()
  }, [nonMembers])

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
          titleComponent={
            <ChannelMembershipAppbarHeaderTitle
              title={HEADER_TITLE}
              channelTitle={displayedName}
              channelType={channelType}
            />
          }
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
            placeholder={SEARCH_PLACEHOLDER}
            value={membershipSearchInput}
            length={20}
            disabled={loading}
            validation={inputError}
            ref={inputRef}
            autoCorrect={false}
            bottomSeparator={<View style={{ height: 1, backgroundColor: defaultTheme.palette.background.gray06 }} />}
            // Full-bleed, borderless field with a "To:" prefix, per the DM designs.
            wrapperStyle={{ display: 'flex', flexDirection: 'column' }}
            style={{ borderWidth: 0, borderRadius: 0, height: 44, paddingHorizontal: 16 }}
            leftAccessory={
              <Typography fontSize={16} style={{ color: defaultTheme.palette.typography.gray50, paddingRight: 8 }}>
                {'To:'}
              </Typography>
            }
            rightAccessory={
              membershipSearchInput ? (
                <TouchableOpacity
                  onPress={() => onChangeText('')}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  testID={`update-channel-membership-input-clear-${channelId}`}
                >
                  <Typography fontSize={16} style={{ color: defaultTheme.palette.typography.gray70 }}>
                    {'✕'}
                  </Typography>
                </TouchableOpacity>
              ) : undefined
            }
            keyboardType={'email-address'}
            testID={`update-channel-membership-input-${channelId}`}
          />
          <UpdateChannelMembershipList
            options={options}
            visibleOptionsIndices={visibleOptionIndices}
            setOptions={setOptions}
            channelId={channelId}
            nonMembers={nonMembers}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  )
}
