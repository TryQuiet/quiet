import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'

import UpdateModal, { UpdateModalProps } from './UpdateModal'

import { withTheme } from '../../../storybook/decorators'
import theme from '../../../theme'

import Button from '@mui/material/Button'

const Template: ComponentStory<typeof UpdateModal> = args => {
  return <UpdateModal {...args} />
}

const args: UpdateModalProps = {
  open: true,
  handleClose: function (): void {
    console.log('modal closed')
  },
  buttons: [
    <Button
      variant='contained'
      size='large'
      color='primary'
      type='submit'
      onClick={() => {
        console.log('submit button clicked')
      }}
      style={{
        height: 55,
        fontSize: '0.9rem',
        backgroundColor: theme.palette.colors.quietBlue,
      }}
      fullWidth
    >
      Update now
    </Button>,
  ],
  title: 'Software update',
  message: 'An update is available for Quiet.',
}

export const Component = Template.bind({})

Component.args = args

const component: ComponentMeta<typeof UpdateModal> = {
  title: 'Components/UpdateModalComponent',
  decorators: [withTheme],
  component: UpdateModal,
}

export default component
