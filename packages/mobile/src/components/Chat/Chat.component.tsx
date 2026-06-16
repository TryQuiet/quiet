import React, { FC, useRef, useState, useEffect, useCallback, useMemo } from 'react'
import {
  Keyboard,
  View,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Animated,
  ViewToken,
  StyleSheet,
  TextInputChangeEventData,
  TextInputEndEditingEventData,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Appbar } from '../../components/Appbar/Appbar.component'
import { Loading } from '../Loading/Loading.component'
import { ImagePreviewModal } from '../../components/ImageAttachmentPreview/ImageAttachmentPreview.component'
import { Message } from '../Message/Message.component'
import { Input } from '../Input/Input.component'
import { MessageSendButton } from '../MessageSendButton/MessageSendButton.component'
import { ChatProps, ListItem } from './Chat.types'
import { FileActionsProps } from '../FileAttachment/FileAttachment.types'
import { MessagesDivider } from '../MessagesDivider/MessagesDivider.component'
import { DisplayableMessage } from '@quiet/types'
import { AttachmentButton } from '../AttachmentButton/AttachmentButton.component'
import DocumentPicker, { DocumentPickerResponse, types } from 'react-native-document-picker'
import { launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker'
import UploadFilesPreviewsComponent from '../FileAttachmentPreview/FileAttachmentPreview.component'
import { defaultTheme } from '../../styles/themes/default.theme'
import { createLogger } from '../../utils/logger'
import { ChatAppbarHeaderTitle } from './ChatAppbarHeaderTitle.component'

const logger = createLogger('chat:component')

// UI constants
const DEFAULT_PADDING = 20
const DATE_FADE_IN_DURATION = 100 // ms - how quickly the date marker fades in
const DATE_FADE_OUT_DURATION = 200 // ms - how quickly the date marker fades out
const DATE_VISIBILITY_TIMEOUT = 2000 // ms - how long to show date marker after scrolling stops

const ChatInner: FC<ChatProps & FileActionsProps> = ({
  contextMenu,
  sendMessageAction,
  loadMessagesAction,
  handleBackButton,
  channel,
  channelName,
  messages = {
    count: 0,
    groups: {},
  },
  pendingMessages = {},
  downloadStatuses = {},
  maxAutodownloadSizeBytes,
  downloadFile,
  cancelDownload,
  imagePreview,
  setImagePreview,
  openImagePreview,
  updateFileAttachments,
  updateImageAttachments,
  removeFilePreview,
  uploadedFiles,
  openUrl,
  duplicatedUsernameHandleBack,
  unregisteredUsernameHandleBack,
  ready = true,
}) => {
  const [didKeyboardShow, setKeyboardShow] = useState(false)
  const [isKeyboardShowing, setKeyboardShowing] = useState(false)
  const [messageInput, setMessageInput] = useState<string>('')
  const [currentVisibleTimestamp, setCurrentVisibleTimestamp] = useState<number | null>(null)

  const messageInputRef = useRef<null | TextInput>(null)
  // keep latest input text (including any pending autocorrect) in a ref
  const messageInputValueRef = useRef<string>('')

  // useSafeAreaInsets hook to get the insets for the current device
  const insets = useSafeAreaInsets()

  // Animation value for date marker fade effect
  const fadeAnim = useRef(new Animated.Value(0)).current
  const isScrolling = useRef(false)
  const scrollTimer = useRef<NodeJS.Timeout | null>(null)

  // Flatten the nested messages.groups structure into an array that combines dividers and message groups

  const listData = useMemo((): ListItem[] => {
    if (!messages.groups || Object.keys(messages.groups).length === 0) return []

    const out: ListItem[] = []

    Object.keys(messages.groups).forEach(dateKey => {
      const dateDisplay = dateKey // Already formatted (e.g. "Mar 12, 2025")

      // Push divider first (so it sticks visually above its messages)
      out.push({ type: 'divider', id: `divider-${dateKey}`, displayDate: dateDisplay })

      // Each element inside messages.groups[dateKey] is a merged-message array
      messages.groups[dateKey].forEach(group => {
        if (group.length === 0) return // Skip empty groups

        const id = group[0].id // use first message id as stable key
        out.push({
          type: 'message',
          id,
          displayDate: dateDisplay,
          messageGroup: group,
        })
      })
    })

    // Original impl was inverted; newest messages at bottom => reverse here
    return out.reverse()
  }, [messages.groups])

  // Stable scroll handler
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!isScrolling.current) {
        isScrolling.current = true
        // Immediately show the date marker
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: DATE_FADE_IN_DURATION,
          useNativeDriver: true,
        }).start()
      }

      // Reset the scroll timer
      if (scrollTimer.current) {
        clearTimeout(scrollTimer.current)
      }

      // Set a timer to fade out the date marker after scrolling stops
      scrollTimer.current = setTimeout(() => {
        isScrolling.current = false
        // Fade out the date marker
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: DATE_FADE_OUT_DURATION,
          useNativeDriver: true,
        }).start()
      }, DATE_VISIBILITY_TIMEOUT)
    },
    [fadeAnim, DATE_FADE_IN_DURATION, DATE_FADE_OUT_DURATION, DATE_VISIBILITY_TIMEOUT]
  )

  const handleMomentumScrollEnd = useCallback(() => {
    // Keep the date marker visible briefly after momentum scrolling ends
    // then fade it out
    if (scrollTimer.current) {
      clearTimeout(scrollTimer.current)
    }

    // Schedule the fade out
    scrollTimer.current = setTimeout(() => {
      isScrolling.current = false
      // Fade out the date marker
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: DATE_FADE_OUT_DURATION,
        useNativeDriver: true,
      }).start()
    }, DATE_VISIBILITY_TIMEOUT)
  }, [fadeAnim, DATE_FADE_OUT_DURATION, DATE_VISIBILITY_TIMEOUT])

  const flatListRef = useRef<FlatList<ListItem>>(null)

  // We pass this to FlatList to determine which items it will return as viewable
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 0, // 0% threshold means an item is visible when any part is showing
  }).current

  // This callback fires when items enter or exit the viewport to determine the date to show
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      // Skip processing if no viewable items
      if (!viewableItems || viewableItems.length === 0) return

      // Filter only *messages*; dividers don't have timestamps
      const visibleMessages = viewableItems.filter(v => {
        const item = v.item as ListItem
        return item?.type === 'message'
      })

      if (visibleMessages.length === 0) return

      // Find the oldest (earliest) timestamp among visible messages
      // Initialize with MAX_SAFE_INTEGER so any real timestamp will be smaller
      let oldestTimestamp = Number.MAX_SAFE_INTEGER

      // Examine each visible message to find the earliest timestamp
      visibleMessages.forEach(token => {
        // Extract message group from the list item
        const messageItem = token.item as ListItem & { messageGroup?: DisplayableMessage[] }

        // Ensure it's a valid message with data
        if (messageItem.type === 'message' && messageItem.messageGroup && messageItem.messageGroup.length > 0) {
          // Get the timestamp from the first message in the group
          // (Each message group contains messages from the same timestamp)
          const messageTimestamp = messageItem.messageGroup[0].createdAt

          // If we found an earlier timestamp, update our tracking variable
          if (messageTimestamp && messageTimestamp < oldestTimestamp) {
            oldestTimestamp = messageTimestamp
          }
        }
      })

      // Only update if we found a valid timestamp and it's different from current
      if (oldestTimestamp !== Number.MAX_SAFE_INTEGER && currentVisibleTimestamp !== oldestTimestamp) {
        setCurrentVisibleTimestamp(oldestTimestamp)
      }
    },
    [currentVisibleTimestamp]
  )

  // Calculate if files are uploaded - defined at top level
  const checkFilesUploaded = useCallback(() => {
    if (!uploadedFiles) return false
    if (Object.keys(uploadedFiles).length <= 0) return false
    return true
  }, [uploadedFiles])

  // Store result of the check
  const areFilesUploaded = checkFilesUploaded()

  // Calculate if submit should be disabled - defined at top level
  const checkShouldDisableSubmit = useCallback(() => {
    if (!ready) return true

    const isInputEmpty = messageInput.length === 0
    if (isInputEmpty && !areFilesUploaded) return true

    return false
  }, [messageInput, areFilesUploaded, ready])

  // Store result of the check
  const shouldDisableSubmit = checkShouldDisableSubmit()

  useEffect(() => {
    const onKeyboardDidShow = () => {
      setKeyboardShow(true)
    }

    const onKeyboardDidHide = () => {
      setKeyboardShowing(false)
    }

    const showSubscription = Keyboard.addListener('keyboardDidShow', onKeyboardDidShow)
    const hideSubscription = Keyboard.addListener('keyboardDidHide', onKeyboardDidHide)

    return () => {
      showSubscription.remove()
      hideSubscription.remove()
    }
  }, [messageInput?.length, setKeyboardShow, setKeyboardShowing])

  // Clean up any timers when component unmounts
  useEffect(() => {
    return () => {
      if (scrollTimer.current) {
        clearTimeout(scrollTimer.current)
      }
    }
  }, [])

  const onInputTextChange = (value: string) => {
    // track current text on manual entry
    messageInputValueRef.current = value
    setMessageInput(value)
  }
  // capture native change events (e.g., autocorrect commit)
  const onInputChange = useCallback((e: NativeSyntheticEvent<TextInputChangeEventData>) => {
    const value = e.nativeEvent.text
    messageInputValueRef.current = value
    setMessageInput(value)
  }, [])
  // capture end of editing (e.g., on blur)
  const onInputEndEditing = useCallback((e: NativeSyntheticEvent<TextInputEndEditingEventData>) => {
    const value = e.nativeEvent.text
    messageInputValueRef.current = value
    setMessageInput(value)
  }, [])

  const openAttachments = async () => {
    let response: DocumentPickerResponse[]
    try {
      response = await DocumentPicker.pick({
        presentationStyle: 'fullScreen',
        type: [types.allFiles],
        allowMultiSelection: true,
        copyTo: 'cachesDirectory',
      })
    } catch (e) {
      if (!DocumentPicker.isCancel(e)) {
        logger.error(`Could not attach files: ${e.message}`)
        // TODO: display error message to user
      }
      return
    }
    if (response) {
      updateFileAttachments(response)
    }
  }

  const openImages = async () => {
    launchImageLibrary(
      {
        presentationStyle: 'fullScreen',
        mediaType: 'mixed', // photos and videos
        selectionLimit: 5, // we don't want to overwhelm helia or libp2p
      },
      (response: ImagePickerResponse) => {
        if (response.didCancel === true) {
          logger.debug(`User cancelled image library fetch`)
          return
        }

        if (response.errorCode != null || response.errorMessage != null) {
          logger.error(`Error while fetching image library`, response.errorCode, response.errorMessage)
          return
        }

        if (response.assets != null && response.assets.length > 0) {
          updateImageAttachments(response.assets)
        }
      }
    )
  }

  const onPress = () => {
    // only send if there's text or uploaded files
    if (messageInputValueRef.current.length > 0 || areFilesUploaded) {
      if (messageInputValueRef.current.length > 0) {
        // append space to force iOS to commit any pending autocorrect
        const original = messageInputValueRef.current
        const commitText = original + ' '
        // update native text to trigger autocorrect commit
        messageInputRef.current?.setNativeProps({ text: commitText })
        messageInputValueRef.current = commitText
        // after commit, send trimmed text and clear input
        setTimeout(() => {
          const textToSend = messageInputValueRef.current.trim()
          sendMessageAction(textToSend)
          // clear native input and reset state
          messageInputRef.current?.clear()
          messageInputValueRef.current = ''
          setMessageInput('')
        }, 50)
      } else {
        // no text but files attached
        sendMessageAction('')
      }
    }
  }

  const renderItem = useCallback(
    ({ item }: { item: ListItem }) => {
      if (item.type === 'divider') {
        return <MessagesDivider title={item.displayDate} />
      }

      return (
        <Message
          key={item.id}
          data={item.messageGroup}
          downloadStatus={downloadStatuses?.[item.id]}
          downloadFile={downloadFile}
          cancelDownload={cancelDownload}
          openImagePreview={openImagePreview}
          maxAutodownloadSizeBytes={maxAutodownloadSizeBytes}
          openUrl={openUrl}
          pendingMessages={pendingMessages}
          duplicatedUsernameHandleBack={duplicatedUsernameHandleBack}
          unregisteredUsernameHandleBack={unregisteredUsernameHandleBack}
        />
      )
    },
    [
      downloadStatuses,
      downloadFile,
      cancelDownload,
      openImagePreview,
      maxAutodownloadSizeBytes,
      openUrl,
      pendingMessages,
      duplicatedUsernameHandleBack,
      unregisteredUsernameHandleBack,
    ]
  )

  const handleEndReached = useCallback(() => {
    loadMessagesAction(true)
  }, [loadMessagesAction])

  return (
    <View style={styles.container} testID={`chat_${channel?.name}`}>
      <Appbar
        title={channelName}
        titleComponent={<ChatAppbarHeaderTitle title={channelName} isPublic={channel?.public ?? true} />}
        back={handleBackButton}
        contextMenu={contextMenu}
      />
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: 'height' })}
        keyboardVerticalOffset={Platform.select({ ios: insets.bottom, android: insets.bottom })}
        enabled={Platform.select({ ios: true, android: true })}
        style={styles.keyboardAvoidingView}
      >
        {messages.count === 0 ? (
          <Loading title={'Loading messages'} caption={'Chat will become available shortly'} />
        ) : (
          <>
            <View style={styles.messagesContainer}>
              {currentVisibleTimestamp && (
                <Animated.View style={[styles.dateMarker, { opacity: fadeAnim }]}>
                  <MessagesDivider timestamp={currentVisibleTimestamp} isSticky />
                </Animated.View>
              )}
              <FlatList
                ref={flatListRef}
                style={styles.list}
                inverted
                data={listData}
                keyExtractor={(item: ListItem) => item.id}
                renderItem={renderItem}
                onEndReached={handleEndReached}
                onEndReachedThreshold={0.7}
                viewabilityConfig={viewabilityConfig}
                onViewableItemsChanged={onViewableItemsChanged}
                showsVerticalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                onMomentumScrollEnd={handleMomentumScrollEnd}
              />
            </View>
            <View style={styles.bottomControls}>
              <View
                style={[
                  styles.inputContainer,
                  { paddingRight: !didKeyboardShow && !areFilesUploaded ? DEFAULT_PADDING : 0 },
                ]}
              >
                <View style={styles.inputRow}>
                  <View style={styles.inputWrapper}>
                    <View style={styles.inputContent}>
                      <Input
                        ref={messageInputRef}
                        // uncontrolled: do not pass value to allow native setNativeProps to work
                        onChangeText={onInputTextChange}
                        onChange={onInputChange}
                        onEndEditing={onInputEndEditing}
                        placeholder={`Message #${channel?.name}`}
                        multiline={true}
                        style={styles.inputStyle}
                        round
                      />
                    </View>
                    <View
                      style={{
                        position: 'absolute',
                        height: '100%',
                        right: 10,
                        justifyContent: 'center',
                      }}
                    >
                      <AttachmentButton onPress={openImages} />
                    </View>
                  </View>
                  {(didKeyboardShow || areFilesUploaded) && (
                    <MessageSendButton onPress={onPress} disabled={shouldDisableSubmit} />
                  )}
                </View>
                {uploadedFiles && (
                  <UploadFilesPreviewsComponent filesData={uploadedFiles} removeFile={removeFilePreview} />
                )}
              </View>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
      {imagePreview && setImagePreview && (
        <ImagePreviewModal
          imagePreviewData={imagePreview}
          currentChannelName={channel?.name}
          resetPreviewData={() => setImagePreview(null)}
        />
      )}
    </View>
  )
}

// Create styles for components
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-end',
    backgroundColor: defaultTheme.palette.background.white,
    paddingBottom: DEFAULT_PADDING,
  },
  messagesContainer: {
    flex: 1,
  },
  list: {
    paddingLeft: DEFAULT_PADDING,
    paddingRight: DEFAULT_PADDING,
  },
  dateMarker: {
    position: 'absolute',
    zIndex: 20,
    width: '100%',
    backgroundColor: 'white',
  },
  bottomControls: {
    flexDirection: 'row',
    paddingBottom: Platform.select({ ios: 20, android: 0 }),
  },
  inputContainer: {
    width: '100%',
    paddingLeft: DEFAULT_PADDING,
  },
  inputRow: {
    flexDirection: 'row',
  },
  inputWrapper: {
    flex: 1,
  },
  inputContent: {
    justifyContent: 'center',
  },
  inputStyle: {
    paddingRight: 50,
  },
  attachmentButtonContainer: {
    position: 'absolute',
    height: '100%',
    right: 10,
    justifyContent: 'center',
  },
})

export const Chat = React.memo(ChatInner)
