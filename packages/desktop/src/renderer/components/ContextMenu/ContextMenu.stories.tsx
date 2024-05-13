import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'
import { withTheme } from '../../storybook/decorators'
import { ContextMenu, ContextMenuItemList } from './ContextMenu.component'
import { ContextMenuItemProps, ContextMenuProps } from './ContextMenu.types'

const Template: ComponentStory<typeof ContextMenu> = args => {
  return <ContextMenu {...args} />
}

export const Component = Template.bind({})

const channel_items: ContextMenuItemProps[] = [
  {
    title: 'Delete',
    action: () => {
      console.info('clicked on delete channel')
    },
  },
]

const args: ContextMenuProps = {
  title: 'Rockets',
  children: <ContextMenuItemList items={channel_items} />,
  visible: true,
  handleClose: () => {
    console.info('closing menu')
  },
}

Component.args = args

const component: ComponentMeta<typeof ContextMenu> = {
  title: 'Components/ContextMenu',
  decorators: [withTheme],
  component: ContextMenu,
}

export default component
