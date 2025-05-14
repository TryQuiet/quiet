<!--
  Documentation: iOS Autocorrect Workaround for Chat Input
  Explains the append-space hack to commit pending autocorrect suggestions
  and outlines how to test it via unit and e2e tests.
-->

# iOS Autocorrect Workaround in Chat Component

## Problem

On iOS, React Native’s `TextInput` does not always commit the last autocorrect suggestion when the user taps send, leading to:

- Sending the uncorrected text (e.g., “sendd” instead of “send”).
- Leaving the corrected suggestion in the input after send.
- Unexpected keyboard behavior if blurred/refocused.

This is a known issue: facebook/react-native#2552, #9273, keybase/client#19574.

## Workaround

In our `Chat` component we implement the following on send:

1. Check for pending text or attached files.
2. If there is text, append a space via `setNativeProps({ text: original + ' ' })`.  This forces iOS to commit any pending autocorrect.
3. In a short `setTimeout` (e.g. 50ms), read the trimmed text (`.trim()`), call `sendMessageAction(correctedText)`, then clear the input via `.clear()` and reset React state.
4. If no text but files are uploaded, send an empty string to represent a files-only message.

```ts
// Chat.component.tsx (simplified)
const onPress = () => {
  if (messageInputValueRef.current.length > 0 || areFilesUploaded) {
    if (messageInputValueRef.current.length > 0) {
      // commit autocorrect
      const original = messageInputValueRef.current
      const commit = original + ' '
      inputRef.current?.setNativeProps({ text: commit })
      messageInputValueRef.current = commit
      setTimeout(() => {
        const textToSend = messageInputValueRef.current.trim()
        sendMessageAction(textToSend)
        inputRef.current?.clear()
        messageInputValueRef.current = ''
        setMessageInput('')
      }, 50)
    } else {
      sendMessageAction('')
    }
  }
}
```

This approach avoids blur/focus hacks (and keyboard bounce) while ensuring the corrected word is sent.