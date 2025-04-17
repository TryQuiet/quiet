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

export const Chat: FC<ChatProps & FileActionsProps> = ({
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
  const [showShadow, setShowShadow] = useState(false)
  const isScrolling = useRef(false)
  const scrollTimer = useRef<NodeJS.Timeout | null>(null)

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

  // UI constants
  const DEFAULT_PADDING = 20
  const DATE_FADE_IN_DURATION = 100 // ms - how quickly the date marker fades in
  const DATE_FADE_OUT_DURATION = 200 // ms - how quickly the date marker fades out
  const DATE_VISIBILITY_TIMEOUT = 2000 // ms - how long to show date marker after scrolling stops

  const areFilesUploaded = useCallback(() => {
    if (!uploadedFiles) return false
    if (Object.keys(uploadedFiles).length <= 0) return false
    return true
  }, [uploadedFiles])()

  const shouldDisableSubmit = useCallback(() => {
    if (!ready) return true

    const isInputEmpty = messageInput.length === 0
    if (isInputEmpty && !areFilesUploaded) return true

    return false
  }, [messageInput, areFilesUploaded, ready])()

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

  const renderItem = ({ item }: { item: string }) => (
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
  )

  return (
    <View style={{ flex: 1 }} testID={`chat_${channel?.name}`}>
      <Appbar title={`#${channel?.name}`} back={handleBackButton} contextMenu={contextMenu} />
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        keyboardVerticalOffset={Platform.select({ ios: insets.bottom, android: 0 })}
        enabled={Platform.select({ ios: true, android: false })}
        style={{
          flex: 1,
          flexDirection: 'column',
          justifyContent: 'flex-end',
          backgroundColor: defaultTheme.palette.background.white,
          paddingBottom: DEFAULT_PADDING,
        }}
      >
        {messages.count === 0 ? (
          <Loading title={'Loading messages'} caption={'Chat will become available shortly'} />
        ) : (
          <>
            <View style={{ flex: 1 }}>
              {currentVisibleDate && (
                <Animated.View
                  style={{
                    opacity: fadeAnim,
                    position: 'absolute',
                    zIndex: 20,
                    width: '100%',
                    backgroundColor: 'white',
                    ...(showShadow
                      ? {
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.25,
                          shadowRadius: 3.84,
                          elevation: 5,
                        }
                      : {}),
                  }}
                >
                  <MessagesDivider title={currentVisibleDate} isSticky />
                </Animated.View>
              )}
              <FlatList
                ref={flatListRef}
                // There's a performance issue with inverted prop on FlatList, so we're double rotating the elements as a workaround
                // https://github.com/facebook/react-native/issues/30034
                style={{
                  transform: [{ rotate: '180deg' }],
                  paddingLeft: DEFAULT_PADDING,
                  paddingRight: DEFAULT_PADDING,
                }}
                data={Object.keys(messages.groups).reverse()}
                keyExtractor={item => item}
                renderItem={item => {
                  return <View style={{ transform: [{ rotate: '180deg' }] }}>{renderItem(item)}</View>
                }}
                onEndReached={() => {
                  loadMessagesAction(true)
                }}
                onEndReachedThreshold={0.7}
                viewabilityConfig={viewabilityConfig}
                onViewableItemsChanged={onViewableItemsChanged}
                showsVerticalScrollIndicator={false}
                onScroll={event => {
                  // Custom handling for determining which date is at the fixed position
                  const { y } = event.nativeEvent.contentOffset

                  // Show the date marker when scrolling starts
                  if (!isScrolling.current) {
                    isScrolling.current = true
                    // Immediately show the date marker with shadow
                    setShowShadow(true)
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
                    }).start(() => {
                      setShowShadow(false)
                    })
                  }, DATE_VISIBILITY_TIMEOUT)
                }}
                scrollEventThrottle={16} // Updates approx every 16ms (60fps) for smooth animation
                onMomentumScrollEnd={() => {
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
                    }).start(() => {
                      setShowShadow(false)
                    })
                  }, DATE_VISIBILITY_TIMEOUT)
                }}
              />
            </View>
            <View
              style={{
                flexDirection: 'row',
                paddingBottom: Platform.select({ ios: 20, android: 0 }),
              }}
            >
              <View
                style={{
                  width: '100%',
                  paddingLeft: DEFAULT_PADDING,
                  paddingRight: !didKeyboardShow && !areFilesUploaded ? DEFAULT_PADDING : 0,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <View style={{ justifyContent: 'center' }}>
                      <Input
                        ref={messageInputRef}
                        onChangeText={onInputTextChange}
                        placeholder={`Message #${channel?.name}`}
                        multiline={true}
                        style={{ paddingRight: 50 }}
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

export const ChannelMessagesComponent: React.FC<ChannelMessagesComponentProps & FileActionsProps> = ({
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
