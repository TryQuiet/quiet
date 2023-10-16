import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'
import { withTheme } from '../../../storybook/decorators'
import PossibleImpersonationAttackModalComponent, {
  PossibleImpersonationAttackModalComponentProps,
} from './PossibleImpersonationAttackModal.component'

const Template: ComponentStory<typeof PossibleImpersonationAttackModalComponent> = args => {
  return (
    <div style={{ height: '800px', position: 'relative' }}>
      <PossibleImpersonationAttackModalComponent {...args} />
    </div>
  )
}

export const Component = Template.bind({})

const args: PossibleImpersonationAttackModalComponentProps = {
  handleClose: function (): void {},
  open: true,
  communityName: 'devteam',
  leaveCommunity: function (): void {},
}

Component.args = args

const component: ComponentMeta<typeof PossibleImpersonationAttackModalComponent> = {
  title: 'Components/PossibleImpersonationAttackModalComponent',
  decorators: [withTheme],
  component: PossibleImpersonationAttackModalComponent,
}

export default component
