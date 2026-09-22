import React, { useEffect } from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'

import { withTheme } from '../../storybook/decorators'

import { ServerOfferComponent, ServerOfferComponentProps } from './ServerOfferComponent'

const Template: ComponentStory<typeof ServerOfferComponent> = args => {
  return <ServerOfferComponent {...args} />
}

const args: ServerOfferComponentProps = {
  open: true,
  handleClose: selection => {
    // eslint-disable-next-line no-console
    console.info('ServerOffer closed with selection:', selection)
  },
}

/** The offer as the app shows it during community creation: no "Don't show this again". */
export const Component = Template.bind({})
Component.args = args
Component.storyName = 'Want a server?'

/** The frame in full (2922:10009): the rule and the checkbox below the actions. */
export const WithDontShowAgain = Template.bind({})
WithDontShowAgain.args = { ...args, showDontShowAgain: true }
WithDontShowAgain.storyName = "With Don't show this again"

/**
 * The same with the box ticked — the library's checkbox filled in gray 50. The
 * component owns that state, so the story ticks it the way a user would. The
 * modal's portal appears a pass later than this effect, so the lookup is at
 * document level and retries until the box is there.
 */
export const DontShowAgainChecked = () => {
  useEffect(() => {
    let tries = 0
    const tick = setInterval(() => {
      const checkbox = document.body.querySelector<HTMLInputElement>('input[type="checkbox"]')
      if (checkbox && !checkbox.checked) checkbox.click()
      if (checkbox || ++tries > 40) clearInterval(tick)
    }, 25)
    return () => clearInterval(tick)
  }, [])
  return <ServerOfferComponent {...args} showDontShowAgain />
}
DontShowAgainChecked.storyName = "Don't show this again, checked"

const component: ComponentMeta<typeof ServerOfferComponent> = {
  title: 'Components/ServerOffer',
  decorators: [withTheme],
  component: ServerOfferComponent,
  // As every design-library entry does; the ticked story also clicks on mount, which
  // Chromatic would race.
  parameters: { chromatic: { disableSnapshot: true } },
}

export default component
