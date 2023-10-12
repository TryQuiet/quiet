import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'
import { withTheme } from '../../../../storybook/decorators'
import { InviteComponent, InviteComponentProps } from './Invite.component'
import { pairsToInvitationShareUrl } from '@quiet/common'

const Template: ComponentStory<typeof InviteComponent> = args => {
  return <InviteComponent {...args} />
}

export const Component = Template.bind({})
let revealInputValue = true
const invitationLink = pairsToInvitationShareUrl({
  pairs: [
    {
      peerId: 'QmVTkUad2Gq3MkCa8gf12R1gsWDfk2yiTEqb6YGXDG2iQ3',
      onionAddress: 'p3oqdr53dkgg3n5nuezlzyawhxvit5efxzlunvzp7n7lmva6fj3i43ad',
    },
    {
      peerId: 'Qmd2Un9AynokZrcZGsMuaqgupTtidHGQnUkNVfFFAef97C',
      onionAddress: 'vnywuiyl7p7ig2murcscdyzksko53e4k3dpdm2yoopvvu25p6wwjqbad',
    },
    {
      peerId: 'QmXRY4rhAx8Muq8dMGkr9qknJdE6UHZDdGaDRTQEbwFN5b',
      onionAddress: '6vu2bxki777it3cpayv6fq6vpl4ke3kzj7gxicfygm55dhhtphyfdvyd',
    },
    {
      peerId: 'QmT18UvnUBkseMc3SqnfPxpHwN8nzLrJeNSLZtc8rAFXhz',
      onionAddress: 'y7yczmugl2tekami7sbdz5pfaemvx7bahwthrdvcbzw5vex2crsr26qd',
    },
  ],
  psk: '12345',
})
const args: InviteComponentProps = {
  invitationLink: invitationLink,
  revealInputValue: revealInputValue,
  handleClickInputReveal: () => {
    revealInputValue = !revealInputValue
  },
}

Component.args = args

const component: ComponentMeta<typeof InviteComponent> = {
  title: 'Components/InviteFriend',
  decorators: [withTheme],
  component: InviteComponent,
}

export default component
