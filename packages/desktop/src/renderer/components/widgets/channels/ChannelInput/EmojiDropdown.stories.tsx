import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'
import { withTheme } from '../../../../storybook/decorators'
import EmojiDropdown from './EmojiDropdown'
import { emojiShortcodes } from './utils/emojiCodes'

export default {
  title: 'Components/ChannelInput/EmojiDropdown',
  component: EmojiDropdown,
  decorators: [withTheme],
  parameters: {
    layout: 'centered',
  },
} as ComponentMeta<typeof EmojiDropdown>

const Template: ComponentStory<typeof EmojiDropdown> = args => {
  return (
    <div style={{ padding: '20px', height: '400px' }}>
      <EmojiDropdown {...args} />
    </div>
  )
}

// Simple example with many emoji options to demonstrate scrolling
export const Default = Template.bind({})
Default.args = {
  suggestions: Object.keys(emojiShortcodes).slice(0, 30),
  selectedIndex: 0,
  position: { top: 0, left: 0, width: 300 },
  onClickAway: () => console.log('Click away'),
  onEmojiSelect: shortcode => console.log('Selected:', shortcode),
}

// Example positioned at the edge to demonstrate overflow handling
export const EdgePosition = Template.bind({})
EdgePosition.args = {
  suggestions: Object.keys(emojiShortcodes).slice(0, 10),
  selectedIndex: 0,
  position: { top: 0, left: 500, width: 300 },
  onClickAway: () => console.log('Click away'),
  onEmojiSelect: shortcode => console.log('Selected:', shortcode),
}

// Example with many emojis
export const ManyEmojis = Template.bind({})
ManyEmojis.args = {
  suggestions: Object.keys(emojiShortcodes).slice(0, 50),
  selectedIndex: 0,
  position: { top: 0, left: 0, width: 300 },
  onClickAway: () => console.log('Click away'),
  onEmojiSelect: shortcode => console.log('Selected:', shortcode),
}

// Example with a selected item
export const SelectedItem = Template.bind({})
SelectedItem.args = {
  suggestions: Object.keys(emojiShortcodes).slice(0, 20),
  selectedIndex: 5,
  position: { top: 0, left: 0, width: 300 },
  onClickAway: () => console.log('Click away'),
  onEmojiSelect: shortcode => console.log('Selected:', shortcode),
}
