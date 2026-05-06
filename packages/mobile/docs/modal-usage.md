# Modal Component Usage Guidelines

## Safe Area Handling for Modal Components

### Problem

On iOS devices with notches, UI elements placed at the top of the screen may be inaccessible if they don't account for the safe area. This is particularly problematic for modal components that render outside the main navigation stack, as they don't inherit the app-level `SafeAreaView` context.

### Solution: SafeAreaModal Component

To ensure proper handling of safe areas in modals, we've created a `SafeAreaModal` component that must be used instead of React Native's built-in `Modal`.

```javascript
import { SafeAreaModal } from 'src/components/SafeAreaModal/SafeAreaModal.component';

// Use just like a standard Modal component
<SafeAreaModal visible={true} onRequestClose={handleClose}>
  <View>
    {/* Modal content */}
  </View>
</SafeAreaModal>
```

**Important**: Direct use of React Native's `Modal` component is not allowed and will fail ESLint checks.

### SafeAreaModal API

The `SafeAreaModal` component accepts all the same props as React Native's `Modal` component, plus:

| Prop | Type | Description |
|------|------|-------------|
| `contentStyle` | `ViewStyle` | Additional styles to apply to the container View that wraps the modal content |

### Why This Matters

Without proper safe area handling:
- Back buttons or close icons may be placed under the notch or status bar
- Users on notched iOS devices may be unable to close modals
- UI elements may be obscured by device hardware features

By properly implementing safe area insets, you ensure your app is accessible to all users, regardless of their device.