import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'

import { withTheme } from '../../../../storybook/decorators'
import QRCodeComponent, { QRCodeProps } from './QRCode.component'
import { composeInvitationShareUrl } from '@quiet/common'

const invitationLink = composeInvitationShareUrl({
    pairs: [
        {
            peerId: 'QmVTkUad2Gq3MkCa8gf12R1gsWDfk2yiTEqb6YGXDG2iQ3',
            onionAddress: 'p3oqdr53dkgg3n5nuezlzyawhxvit5efxzlunvzp7n7lmva6fj3i43ad',
        },
        {
            peerId: 'Qmd2Un9AynokZrcZGsMuaqgupTtidHGQnUkNVfFFAef97C',
            onionAddress: 'vnywuiyl7p7ig2murcscdyzksko53e4k3dpdm2yoopvvu25p6wwjqbad',
        },
    ],
    psk: '12345',
})

const Template: ComponentStory<typeof QRCodeComponent> = args => {
    return <QRCodeComponent {...args} />
}

export const Component = Template.bind({})

const args: QRCodeProps = {
    value: invitationLink,
}

Component.args = args

const component: ComponentMeta<typeof QRCodeComponent> = {
    title: 'Components/QRCode',
    decorators: [withTheme],
    component: QRCodeComponent,
}

export default component
