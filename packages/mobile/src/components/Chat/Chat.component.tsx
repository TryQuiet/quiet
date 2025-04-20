import React, { FC, useRef, useState, useEffect, useCallback } from 'react'
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
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Appbar } from '../../components/Appbar/Appbar.component'
import { Loading } from '../Loading/Loading.component'
import { ImagePreviewModal } from '../../components/ImagePreview/ImagePreview.component'
import { Message } from '../Message/Message.component'
import { Input } from '../Input/Input.component'
import { MessageSendButton } from '../MessageSendButton/MessageSendButton.component'
import { MessagesDivider } from '../MessagesDivider/MessagesDivider.component'
import { ChannelMessagesComponentProps, ChatProps } from './Chat.types'
import { FileActionsProps } from '../UploadedFile/UploadedFile.types'
import { AttachmentButton } from '../AttachmentButton/AttachmentButton.component'
import DocumentPicker, { DocumentPickerResponse, types } from 'react-native-document-picker'
import UploadFilesPreviewsComponent from '../FileUploadingPreview/UploadingPreview.component'
import { defaultTheme } from '../../styles/themes/default.theme'
import { createLogger } from '../../utils/logger'

const logger = createLogger('chat:component')

const ChatInner: FC<ChatProps & FileActionsProps> = ({
  contextMenu,
  sendMessageAction,
  loadMessagesAction,
  handleBackButton,
  channel,
  messages = {
    count: 0,
    groups: {},
  },
  pendingMessages = {},
  downloadStatuses = {},
  downloadFile,
  cancelDownload,
  imagePreview,
  setImagePreview,
  openImagePreview,
  updateUploadedFiles,
  removeFilePreview,
  uploadedFiles,
  openUrl,
  duplicatedUsernameHandleBack,
  unregisteredUsernameHandleBack,
  ready = true,
}) => {
  const [didKeyboardShow, setKeyboardShow] = useState(false)
  const [messageInput, setMessageInput] = useState<string>('')
  const [currentVisibleDate, setCurrentVisibleDate] = useState<string | null>(null)

  // Animation value for date marker fade effect
  const fadeAnim = useRef(new Animated.Value(0)).current
  const isScrolling = useRef(false)
  const scrollTimer = useRef<NodeJS.Timeout | null>(null)

  // UI constants
  const DEFAULT_PADDING = 20
  const DATE_FADE_IN_DURATION = 100 // ms - how quickly the date marker fades in
  const DATE_FADE_OUT_DURATION = 200 // ms - how quickly the date marker fades out
  const DATE_VISIBILITY_TIMEOUT = 2000 // ms - how long to show date marker after scrolling stops

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

      // We're now handling date changes through onViewableItemsChanged
      // Just let scroll animation show/hide the marker

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

  const messageInputRef = useRef<null | TextInput>(null)
  const flatListRef = useRef<FlatList>(null)

  // Visibility detection constants
  const VISIBILITY_THRESHOLD = 0 // Any part of an item visible (0%) counts as "viewable"

  // Use a simple viewability configuration - items are either visible or not
  const viewabilityConfig = useRef({
    // The minimum percent of an item that must be visible to count as "viewable"
    // Using 0 means "any part visible at all" - most sensitive setting
    itemVisiblePercentThreshold: VISIBILITY_THRESHOLD,
  }).current

  // This callback fires when items enter or exit the viewport
  const onViewableItemsChanged = useRef(
    ({ viewableItems, changed }: { viewableItems: ViewToken[]; changed: ViewToken[] }) => {
      // If no items are visible, don't update
      if (viewableItems.length === 0) return

      // Get all dates currently visible on screen
      // The ViewToken type has item as any, so we need to cast it to string
      const visibleDates = viewableItems.map(token => token.item as string)

      // Get the "oldest" date (which is actually the earliest chronologically)
      // Since our dates are formatted like "January 1, 2023", we need to parse them
      // to determine which is oldest
      const oldestDate = findOldestDate(visibleDates)

      // Update if the oldest visible date has changed
      if (currentVisibleDate !== oldestDate) {
        setCurrentVisibleDate(oldestDate)
      }
    }
  ).current

  // Helper function to find the earliest date from an array of date strings
  const findOldestDate = (dateStrings: string[]): string => {
    if (dateStrings.length === 0) return ''
    if (dateStrings.length === 1) return dateStrings[0]

    // Since we can sort these by their index in the original array, we can
    // look at the order of them in the messages.groups object
    const dateKeys = Object.keys(messages.groups).reverse()

    // Find the earliest date that's visible (the one with the highest index in our reversed array)
    let earliestIndex = -1
    let earliestDate = ''

    for (const dateString of dateStrings) {
      const index = dateKeys.indexOf(dateString)
      if (index > earliestIndex) {
        earliestIndex = index
        earliestDate = dateString
      }
    }

    return earliestDate
  }

  const insets = useSafeAreaInsets()

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
      setKeyboardShow(false)
    }

    const showSubscription = Keyboard.addListener('keyboardDidShow', onKeyboardDidShow)
    const hideSubscription = Keyboard.addListener('keyboardDidHide', onKeyboardDidHide)

    return () => {
      showSubscription.remove()
      hideSubscription.remove()
    }
  }, [messageInput?.length, setKeyboardShow])

  // Initialize the current visible date when messages load, but don't show it
  useEffect(() => {
    if (Object.keys(messages.groups).length > 0) {
      const firstDateKey = Object.keys(messages.groups).reverse()[0]
      setCurrentVisibleDate(firstDateKey)
      // Don't show the date marker initially - only show when scrolling
    }
  }, [messages.groups])

  // Clean up any timers when component unmounts
  useEffect(() => {
    return () => {
      if (scrollTimer.current) {
        clearTimeout(scrollTimer.current)
      }
    }
  }, [])

  const onInputTextChange = (value: string) => {
    setMessageInput(value)
  }

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
      updateUploadedFiles(response)
    }
  }

  const onPress = () => {
    if ((messageInputRef.current && messageInput?.length > 0) || areFilesUploaded) {
      messageInputRef?.current?.clear()
      sendMessageAction(messageInput)
      setMessageInput('')
    }
  }

  // Stable renderItem - no need to rotate with inverted FlatList
  const renderDateGroup = useCallback(
    ({ item }: { item: string }) => (
      <ChannelMessagesComponent
        messages={messages.groups[item]}
        pendingMessages={pendingMessages}
        day={item}
        downloadStatuses={downloadStatuses}
        downloadFile={downloadFile}
        cancelDownload={cancelDownload}
        openImagePreview={openImagePreview}
        openUrl={openUrl}
        duplicatedUsernameHandleBack={duplicatedUsernameHandleBack}
        unregisteredUsernameHandleBack={unregisteredUsernameHandleBack}
      />
    ),
    [
      messages.groups,
      pendingMessages,
      downloadStatuses,
      downloadFile,
      cancelDownload,
      openImagePreview,
      openUrl,
      duplicatedUsernameHandleBack,
      unregisteredUsernameHandleBack,
    ]
  )

  // Stable keyExtractor function
  const keyExtractorFn = useCallback((item: string) => item, [])

  // Stable onEndReached handler
  const handleEndReached = useCallback(() => {
    loadMessagesAction(true)
  }, [loadMessagesAction])

  return (
    <View style={styles.container} testID={`chat_${channel?.name}`}>
      <Appbar title={`#${channel?.name}`} back={handleBackButton} contextMenu={contextMenu} />
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        keyboardVerticalOffset={Platform.select({ ios: insets.bottom, android: 0 })}
        enabled={Platform.select({ ios: true, android: false })}
        style={styles.keyboardAvoidingView}
      >
        {messages.count === 0 ? (
          <Loading title={'Loading messages'} caption={'Chat will become available shortly'} />
        ) : (
          <>
            <View style={styles.messagesContainer}>
              {currentVisibleDate && (
                <Animated.View style={[styles.dateMarker, { opacity: fadeAnim }]}>
                  <MessagesDivider title={currentVisibleDate} isSticky />
                </Animated.View>
              )}
              <FlatList
                ref={flatListRef}
                style={styles.list}
                inverted={true} // Use built-in inverted prop instead of manual rotation
                data={Object.keys(messages.groups).reverse()} // Need to keep reverse for proper chronological order
                keyExtractor={keyExtractorFn}
                renderItem={renderDateGroup}
                onEndReached={handleEndReached}
                onEndReachedThreshold={0.7}
                viewabilityConfig={viewabilityConfig}
                onViewableItemsChanged={onViewableItemsChanged}
                showsVerticalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16} // Updates approx every 16ms (60fps) for smooth animation
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
                        onChangeText={onInputTextChange}
                        placeholder={`Message #${channel?.name}`}
                        multiline={true}
                        style={styles.inputStyle}
                        round
                      />
                    </View>
                    <View style={styles.attachmentButtonContainer}>
                      <AttachmentButton onPress={openAttachments} />
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

const ChannelMessagesComponentInner: React.FC<ChannelMessagesComponentProps & FileActionsProps> = ({
  messages,
  day,
  pendingMessages,
  downloadStatuses,
  downloadFile,
  cancelDownload,
  openImagePreview,
  openUrl,
  duplicatedUsernameHandleBack,
  unregisteredUsernameHandleBack,
}) => {
  return (
    <View key={day}>
      <MessagesDivider title={day} />
      {messages.map(data => {
        // Messages merged by sender (DisplayableMessage[])
        const messageId = data[0].id
        return (
          <Message
            key={messageId}
            data={data}
            downloadStatus={downloadStatuses?.[messageId]}
            downloadFile={downloadFile}
            cancelDownload={cancelDownload}
            openImagePreview={openImagePreview}
            openUrl={openUrl}
            pendingMessages={pendingMessages}
            duplicatedUsernameHandleBack={duplicatedUsernameHandleBack}
            unregisteredUsernameHandleBack={unregisteredUsernameHandleBack}
          />
        )
      })}
    </View>
  )
}

export const ChannelMessagesComponent = React.memo(ChannelMessagesComponentInner)

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
    paddingBottom: 20, // DEFAULT_PADDING
  },
  messagesContainer: {
    flex: 1,
  },
  list: {
    paddingLeft: 20, // Using DEFAULT_PADDING value
    paddingRight: 20, // Using DEFAULT_PADDING value
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
    paddingLeft: 20, // DEFAULT_PADDING
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
