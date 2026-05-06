import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'
import { withTheme } from '../../../../storybook/decorators'
import UnregisteredModalComponent, { UnregisteredModalComponentProps } from './UnregisteredModal.component'

const Template: ComponentStory<typeof UnregisteredModalComponent> = args => {
  return (
    <div style={{ height: '800px', position: 'relative' }}>
      <UnregisteredModalComponent {...args} />
    </div>
  )
}

export const Component = Template.bind({})

const args: UnregisteredModalComponentProps = {
  handleClose: function (): void {},
  open: true,
  username: 'johnny',
}

Component.args = args

const component: ComponentMeta<typeof UnregisteredModalComponent> = {
  title: 'Components/UserLabel/UnregisteredModalComponent',
  decorators: [withTheme],
  component: UnregisteredModalComponent,
}

export default component
