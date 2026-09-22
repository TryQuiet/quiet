import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'

import { withTheme } from '../../../storybook/decorators'
import ActionProgress, { ActionProgressProps } from './ActionProgress'

const Template: ComponentStory<typeof ActionProgress> = args => <ActionProgress {...args} />

/** No phases to report: the fill sweeps the track. This is the usual case. */
export const InProgress = Template.bind({})
InProgress.args = { status: 'Leaving community…' } as ActionProgressProps

/** Additional info (5390:19573), the second line: 12/16, grey, centred. */
export const WithSecondaryLine = Template.bind({})
WithSecondaryLine.args = {
  status: 'Joining now!',
  secondary: 'This first time might take 30 seconds, 10 minutes, or even longer.',
} as ActionProgressProps

/** Real phases to report: the fill sits at the value, as Filled=half (5390:19586). */
export const WithPhases = Template.bind({})
WithPhases.args = { status: 'Joining now!', value: 0.5 } as ActionProgressProps

/** Nothing to report yet: the fill is 8px, the floor from Filled=empty (5390:18024). */
export const AtTheStart = Template.bind({})
AtTheStart.args = { status: 'Joining now!', value: 0 } as ActionProgressProps

const component: ComponentMeta<typeof ActionProgress> = {
  title: 'Components/ActionProgress',
  component: ActionProgress,
  decorators: [withTheme],
  parameters: { chromatic: { disableSnapshot: true } },
}

export default component
