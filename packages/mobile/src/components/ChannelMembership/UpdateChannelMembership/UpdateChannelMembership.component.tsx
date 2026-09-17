import React, { useEffect, useMemo, useRef, useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native'

import { defaultPalette } from '../../../styles/palettes/default.palette'
import { Appbar } from '../../Appbar/Appbar.component'
import { UpdateChannelMembershipProps } from './UpdateChannelMembership.types'
import { createLogger } from '../../../utils/logger'
import { ChannelMembershipAppbarHeaderTitle } from '../ChannelMembershipAppbarHeaderTitle.component'
import { SelectableListOption } from './UpdateChannelMembershipList.types'
import { UpdateChannelMembershipList } from './UpdateChannelMembershipList.component'
import { RecipientPill } from '../../RecipientPill/RecipientPill.component'
import { Typography } from '../../Typography/Typography.component'
import Fuse from 'fuse.js'

const logger = createLogger('ChannelMembership')

// The design titles this screen "Add members or roles" (Figma PVQ1Kjf6Cq8ng1czuVtvR8, 838:9305);
// roles do not exist yet, so it names only what you can actually pick.
const HEADER_TITLE = 'Add members'
// The design's placeholder is "E.g. Moderators or @jane123" (838:9439), minus the role half.
const SEARCH_PLACEHOLDER = 'E.g. @jane123'

/**
 * Geometry of the search box, from "Search input" (838:9308): a 16-radius box with a 1pt #E5E5E5
 * border, 16pt of side padding and 8pt above and below, holding the members picked so far as pills
 * that wrap 4pt apart, with the query trailing the last one.
 */
const SEARCH_BOX_RADIUS = 16
const SEARCH_BOX_PADDING_HORIZONTAL = 16
const SEARCH_BOX_PADDING_VERTICAL = 8
const PILL_GAP = 4
// One row of pills plus the padding, so the box keeps its height before anything is picked.
const SEARCH_BOX_MIN_HEIGHT = 42

export const UpdateChannelMembership: React.FC<UpdateChannelMembershipProps> = ({
  channelTitle,
  channelName,
  channelId,
  channelType,
  channelIsPublic,
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

  // Everyone picked so far, drawn as pills in the search box (838:9308). Members who already
  // belong to the channel are selected but immutable, and the design has no pill for them — there
  // is nothing to remove.
  const selectedRecipients = useMemo(
    () =>
      (options ?? [])
        .filter(option => option.selected && option.mutable)
        .map(option => ({
          userId: option.id,
          label: option.label,
          photo: nonMembers[option.id]?.user.photo,
          profilePhoto: nonMembers[option.id]?.user.profilePhoto,
        })),
    [options, nonMembers]
  )

  // Removing a pill has to clear the same option the list draws its checkbox from, so the two stay
  // in step.
  const removeRecipient = (userId: string) => {
    setOptions(current => current?.map(option => (option.id === userId ? { ...option, selected: false } : option)))
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
              channelIsPublic={channelIsPublic}
            />
          }
          back={goBack}
          // Reached from the channel menu rather than mid-creation, so the leading control closes
          // the screen instead of stepping back through a flow (838:9306).
          crossBackIcon={true}
          submit={onPress}
        />
        <View
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 32,
          }}
        >
          <View style={styles.searchBlock} testID={`update-channel-membership-input-${channelId}`}>
            <Pressable style={styles.searchBox} onPress={() => inputRef.current?.focus()}>
              <View style={styles.searchBoxContent}>
                {selectedRecipients.map(recipient => (
                  <RecipientPill
                    key={recipient.userId}
                    label={recipient.label}
                    userId={recipient.userId}
                    photo={recipient.photo}
                    profilePhoto={recipient.profilePhoto}
                    onRemove={() => removeRecipient(recipient.userId)}
                    testID={`update-channel-membership-recipient-pill-${recipient.userId}`}
                  />
                ))}
                <TextInput
                  ref={inputRef}
                  style={styles.searchInput}
                  value={membershipSearchInput}
                  onChangeText={onChangeText}
                  // The placeholder belongs to the empty box; beside pills it would read as one
                  // more of them.
                  placeholder={selectedRecipients.length > 0 ? undefined : SEARCH_PLACEHOLDER}
                  placeholderTextColor={defaultPalette.typography.gray50}
                  editable={!loading}
                  maxLength={20}
                  autoCorrect={false}
                  autoCapitalize={'none'}
                  keyboardType={'email-address'}
                  testID={'input'}
                />
              </View>
            </Pressable>
            {inputError ? (
              <Typography fontSize={14} color={'error'} style={styles.validation}>
                {inputError}
              </Typography>
            ) : null}
          </View>
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

const styles = StyleSheet.create({
  // "Frame 103" (838:9307): the box inset 16 on three sides, closed by a hairline. The 16pt below
  // belonged to the caption the design puts there, which this screen deliberately leaves out.
  searchBlock: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: defaultPalette.background.gray06,
  },
  searchBox: {
    minHeight: SEARCH_BOX_MIN_HEIGHT,
    justifyContent: 'center',
    borderRadius: SEARCH_BOX_RADIUS,
    borderWidth: 1,
    borderColor: defaultPalette.appBar.gray,
    backgroundColor: defaultPalette.background.white,
    paddingHorizontal: SEARCH_BOX_PADDING_HORIZONTAL,
    paddingVertical: SEARCH_BOX_PADDING_VERTICAL,
  },
  searchBoxContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: PILL_GAP,
  },
  searchInput: {
    flexGrow: 1,
    minWidth: 96,
    padding: 0,
    fontSize: 14,
    lineHeight: 20,
    color: defaultPalette.typography.gray90,
  },
  validation: {
    paddingTop: 8,
    paddingHorizontal: 8,
  },
})
