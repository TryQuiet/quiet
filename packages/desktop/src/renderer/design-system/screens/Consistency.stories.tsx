import React, { useState } from 'react'
import { ComponentMeta } from '@storybook/react'

import Button from '@mui/material/Button'
import MenuList from '@mui/material/MenuList'
import Typography from '@mui/material/Typography'

import { NotificationsOptions, NotificationsSounds } from '@quiet/state-manager'

import { withTheme } from '../../storybook/decorators'
import { Page, Section } from '../specimen/ui'

import Tooltip from '../../components/ui/Tooltip/Tooltip'
import { TextField } from '../../components/ui/TextField/TextField'
import LoadingButton from '../../components/ui/LoadingButton/LoadingButton'
import PopupMenu from '../../components/ui/PopupMenu/PopupMenu'
import MenuActionItem from '../../components/ui/MenuAction/MenuActionItem'
import Modal from '../../components/ui/Modal/Modal'
import QuitAppDialog from '../../components/ui/QuitApp/QuitAppDialog'
import NewMessagesInfoComponent from '../../components/Channel/NewMessagesInfo/NewMessagesInfoComponent'
import { NotificationsComponent } from '../../components/Settings/Tabs/Notifications/NotificationsComponent'
import { AttachmentsComponent } from '../../components/Settings/Tabs/Attachments/AttachmentsComponent'

// The controls the consistency audit (design-system/CONSISTENCY_AUDIT.md) moved
// onto the theme, shown in the states that changed. Everything else the audit
// touched has a story of its own under Components/*.

const noop = () => {}

const Row: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap', padding: '8px 0' }}>
    {children}
  </div>
)

const MenuDemo: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)
  return (
    <div style={{ height: 240 }}>
      <Button ref={setAnchorEl} variant='outlined'>
        Anchor
      </Button>
      {anchorEl ? (
        <PopupMenu open anchorEl={anchorEl} placement='bottom-start' offset={8}>
          <MenuList>
            <MenuActionItem title='Edit message' onClick={noop} />
            <MenuActionItem title='Copy link' onClick={noop} />
            <MenuActionItem title='Delete' onClick={noop} />
          </MenuList>
        </PopupMenu>
      ) : null}
    </div>
  )
}

export const Controls = () => (
  <Page
    title='Controls on the theme'
    subtitle='Tooltip, inputs, the secondary button, overlay menus and the new-messages banner: theme overrides from design-system/theme/components.ts.'
  >
    <Section label='Tooltip · Tooltip-content 3490:10102 · ink, radius 8, 8/16, 14/20'>
      <div style={{ display: 'flex', gap: 96, padding: '56px 0 40px' }}>
        <Tooltip title='Create new channel' open placement='top'>
          <Button variant='outlined'>Above</Button>
        </Tooltip>
        <Tooltip title='Create new channel' open placement='bottom'>
          <Button variant='outlined'>Below</Button>
        </Tooltip>
      </div>
    </Section>

    <Section label='Text field · Input3.0 5077:43258 · 42 tall, radius 8, #999999, focussed #1B6FEC'>
      <Row>
        <div style={{ width: 280 }}>
          <Typography variant='body2'>Channel name</Typography>
          <TextField
            fullWidth
            classes=''
            errors={{}}
            onchange={noop}
            onblur={noop}
            placeholder='Enter a channel name'
          />
        </div>
        <div style={{ width: 280 }}>
          <Typography variant='body2'>Channel name</Typography>
          <TextField
            fullWidth
            classes=''
            errors={{}}
            onchange={noop}
            onblur={noop}
            defaultValue='wins-and-data'
            autoFocus
          />
        </div>
        <div style={{ width: 280 }}>
          <Typography variant='body2'>Channel name</Typography>
          <TextField
            fullWidth
            classes=''
            name='channelName'
            errors={{ channelName: { message: 'Channel name is taken', type: 'validate' } }}
            onchange={noop}
            onblur={noop}
            defaultValue='general'
          />
        </div>
      </Row>
    </Section>

    <Section label='Buttons · action bar 3505:10336 · secondary = outlined, 1px #B3B3B3, 14/20 at size=small; radius 16 from the shared MuiButton overrides'>
      <Row>
        <Button variant='outlined' size='small'>
          Never mind
        </Button>
        <LoadingButton text='Delete channel' />
        <Button variant='outlined' size='small' disabled>
          Disabled
        </Button>
      </Row>
    </Section>

    <Section label='Overlay menu · 5578:43731 · radius 16, 16 top/bottom, rows 48 with 12/16'>
      <MenuDemo />
    </Section>

    <Section label='New messages · alert-new-messages 1058:618 · 32 tall, radius 8, 12/16'>
      <div style={{ position: 'relative', height: 72, border: '1px dashed #E2E6DA' }}>
        <NewMessagesInfoComponent show scrollBottom={noop} />
      </div>
    </Section>
  </Page>
)

export const SettingsTabs = () => (
  <Page
    title='Settings tabs'
    subtitle='Notifications and Files and Images: subtitles on the title role (20/28), labels on the body role, radios 24 in.'
  >
    <Row>
      <div style={{ width: 375, padding: 16, border: '1px solid #E2E6DA' }}>
        <NotificationsComponent
          notificationsOption={NotificationsOptions.notifyForEveryMessage}
          notificationsSound={NotificationsSounds.librarianShhh}
          setNotificationsOption={noop}
          setNotificationsSound={noop}
        />
      </div>
      <div style={{ width: 375, padding: 16, border: '1px solid #E2E6DA' }}>
        <AttachmentsComponent maxAutodownloadBytes={20 * 1024 * 1024} setMaxAutodownloadBytes={noop} />
      </div>
    </Row>
  </Page>
)

export const ModalTitleBar = () => (
  <Modal open handleClose={noop} title='Create a new channel' fullPage={false} contentWidth={600} contentHeight={160}>
    <div style={{ padding: 24 }}>
      <Typography variant='body2'>
        The shell&rsquo;s title bar: h5 (16/24 w500), 60 tall, glyph 16 from the edge.
      </Typography>
    </div>
  </Modal>
)

export const QuitDialog = () => <QuitAppDialog open handleClose={noop} handleQuit={noop} />

const component: ComponentMeta<typeof Controls> = {
  title: 'Components/Consistency',
  decorators: [withTheme],
  parameters: { chromatic: { disableSnapshot: true } },
}

export default component
