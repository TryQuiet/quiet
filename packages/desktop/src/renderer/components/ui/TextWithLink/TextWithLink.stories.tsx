import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'

import { withTheme } from '../../../storybook/decorators'

import TextWithLink, { TextWithLinkProps } from './TextWithLink'

import { createLogger } from '../../../logger'

const logger = createLogger('textWithLink:stories')

const Template: ComponentStory<typeof TextWithLink> = args => {
  return <TextWithLink {...args} />
}

export const Component = Template.bind({})

const args: TextWithLinkProps = {
  text: 'Here is %a text',
  links: [
    {
      tag: 'a',
      label: 'linked',
      action: () => {
        logger.info('link clicked')
      },
    },
  ],
}

Component.args = args

const component: ComponentMeta<typeof TextWithLink> = {
  title: 'Components/TextWithLink',
  decorators: [withTheme],
  component: TextWithLink,
}

export default component
