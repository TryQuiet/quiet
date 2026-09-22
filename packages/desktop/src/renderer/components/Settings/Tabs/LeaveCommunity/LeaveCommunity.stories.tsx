import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'

import { withTheme } from '../../../../storybook/decorators'
import LeaveCommunityComponent, { LeaveCommunityProps } from './LeaveCommunityComponent'

const Template: ComponentStory<typeof LeaveCommunityComponent> = args => {
  return <LeaveCommunityComponent {...args} />
}

/** Clicks Leave community on mount, so a story can show what happens after it. */
const Started: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const ref = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    ref.current?.querySelector<HTMLButtonElement>('[data-testid="leave-community-button"]')?.click()
  }, [])
  return <div ref={ref}>{children}</div>
}

const args: LeaveCommunityProps = {
  communityName: 'Rockets',
  leaveCommunity: function (): void {},
  open: true,
  handleClose: function (): void {},
}

export const Component = Template.bind({})
Component.args = args

/** Leaving: the title and the warning stay, the buttons give way to the progress. */
export const InProgress: ComponentStory<typeof LeaveCommunityComponent> = storyArgs => (
  <Started>
    <LeaveCommunityComponent {...storyArgs} />
  </Started>
)
InProgress.args = {
  ...args,
  // Never settles, so the story holds the in-progress state.
  leaveCommunity: () => new Promise<void>(() => {}),
}
InProgress.parameters = { chromatic: { disableSnapshot: true } }

/** Failed: the buttons come back, under the error. */
export const Failed: ComponentStory<typeof LeaveCommunityComponent> = storyArgs => (
  <Started>
    <LeaveCommunityComponent {...storyArgs} />
  </Started>
)
Failed.args = {
  ...args,
  leaveCommunity: () => Promise.reject(new Error('backend failed')),
}
Failed.parameters = { chromatic: { disableSnapshot: true } }

const component: ComponentMeta<typeof LeaveCommunityComponent> = {
  title: 'Components/LeaveCommunity',
  decorators: [withTheme],
  component: LeaveCommunityComponent,
}

export default component
