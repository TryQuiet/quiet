import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Grid from '@mui/material/Grid'
import List from '@mui/material/List'
import Typography from '@mui/material/Typography'
import { styled, useTheme } from '@mui/material/styles'
import { useModal } from '../../../containers/hooks'
import { PublicChannel, UserProfile } from '@quiet/types'
import SidebarHeader from '../../ui/Sidebar/SidebarHeader'
import ChannelsListItem from './ChannelsListItem'
import { useDragLayer } from 'react-dnd'
import type { XYCoord } from 'dnd-core'
import ChannelTypeIcon from '../../widgets/channels/ChannelTypeIcon'

const CHANNEL_LIST_ITEM_TYPE = 'CHANNEL_LIST_ITEM'

const Preview = styled('div')(({ theme }) => ({
  alignItems: 'center',
  backgroundColor: theme.palette.colors.sidebarSelected,
  borderRadius: 4,
  boxShadow: '0 8px 18px rgba(0, 0, 0, 0.22)',
  color: theme.palette.colors.white,
  display: 'flex',
  gap: 4,
  height: 30,
  opacity: 0.92,
  padding: '3px 10px 3px 13px',
  width: 220,
}))

const PreviewText = styled(Typography)(() => ({
  fontWeight: 500,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  textTransform: 'lowercase',
  whiteSpace: 'nowrap',
}))

const DropLine = styled('div')(({ theme }) => ({
  backgroundColor: theme.palette.colors.white,
  borderRadius: 1,
  height: 2,
  margin: '1px 16px',
  opacity: 0.9,
}))

const autoScrollSidebar = (clientOffset: XYCoord | null) => {
  if (!clientOffset) return
  const scrollView = document.querySelector('.SidebarComponentscrollView') as HTMLElement | null
  if (!scrollView) return

  const bounds = scrollView.getBoundingClientRect()
  const threshold = 36
  const maxStep = 18

  if (clientOffset.y < bounds.top + threshold) {
    scrollView.scrollTop -= Math.max(4, maxStep * (1 - (clientOffset.y - bounds.top) / threshold))
  } else if (clientOffset.y > bounds.bottom - threshold) {
    scrollView.scrollTop += Math.max(4, maxStep * (1 - (bounds.bottom - clientOffset.y) / threshold))
  }
}

interface DragPreviewItem {
  name: string
  isPublic: boolean
  unread: boolean
}

const ChannelDragPreview: React.FC = () => {
  const theme = useTheme()
  const { item, itemType, isDragging, currentOffset } = useDragLayer(monitor => ({
    item: monitor.getItem() as DragPreviewItem | null,
    isDragging: monitor.isDragging(),
    itemType: monitor.getItemType(),
    currentOffset: monitor.getClientOffset(),
  }))

  useEffect(() => {
    autoScrollSidebar(currentOffset)
  }, [currentOffset])

  if (!isDragging || itemType !== CHANNEL_LIST_ITEM_TYPE || !item || !currentOffset) return null

  return (
    <div
      style={{
        left: 0,
        pointerEvents: 'none',
        position: 'fixed',
        top: 0,
        transform: `translate(${currentOffset.x - 18}px, ${currentOffset.y - 15}px)`,
        zIndex: 2000,
      }}
    >
      <Preview>
        <ChannelTypeIcon isPublic={item.isPublic} fill='currentColor' style={{ ...theme.typography.subtitle1 }} />
        <PreviewText fontWeight={item.unread ? 600 : 500} variant='body2'>
          {item.name}
        </PreviewText>
      </Preview>
    </div>
  )
}

export interface ChannelsPanelProps {
  channels: PublicChannel[]
  userProfiles: Record<string, UserProfile>
  connectedPeers: string[]
  unreadChannels: string[]
  setCurrentChannel: (id: string) => void
  reorderChannels: (channelIds: string[]) => void
  currentChannelId: string
  createChannelModal: ReturnType<typeof useModal>
  isTorInitialized: boolean
  canCreateChannel: boolean
}

const ChannelsPanel: React.FC<ChannelsPanelProps> = ({
  channels,
  unreadChannels,
  canCreateChannel,
  setCurrentChannel,
  reorderChannels,
  currentChannelId,
  createChannelModal,
}) => {
  const [draftChannels, setDraftChannels] = useState<PublicChannel[] | null>(null)
  const [dropLineIndex, setDropLineIndex] = useState<number | null>(null)
  const draftChannelIdsRef = useRef<string[]>([])
  const hasPendingOrderRef = useRef(false)
  const displayChannels = useMemo(() => draftChannels || channels, [channels, draftChannels])

  useEffect(() => {
    if (!draftChannels) {
      draftChannelIdsRef.current = channels.map(channel => channel.id)
    }
  }, [channels, draftChannels])

  const startChannelDrag = useCallback(
    (index: number, _channelId: string) => {
      const nextDraftChannels = Array.from(channels)
      setDraftChannels(nextDraftChannels)
      setDropLineIndex(index)
      draftChannelIdsRef.current = nextDraftChannels.map(channel => channel.id)
      hasPendingOrderRef.current = false
    },
    [channels]
  )

  const moveChannel = useCallback((dragIndex: number, dropIndex: number, clientOffset: XYCoord | null) => {
    autoScrollSidebar(clientOffset)
    setDropLineIndex(dropIndex)
    const insertionIndex = dropIndex > dragIndex ? dropIndex - 1 : dropIndex
    setDraftChannels(currentChannels => {
      if (!currentChannels || dragIndex === insertionIndex) return currentChannels

      const reorderedChannels = Array.from(currentChannels)
      const [draggedChannel] = reorderedChannels.splice(dragIndex, 1)
      reorderedChannels.splice(insertionIndex, 0, draggedChannel)
      draftChannelIdsRef.current = reorderedChannels.map(channel => channel.id)
      hasPendingOrderRef.current = true
      return reorderedChannels
    })
    return insertionIndex
  }, [])

  const endChannelDrag = useCallback(() => {
    if (hasPendingOrderRef.current) {
      reorderChannels(draftChannelIdsRef.current)
    }
    setDraftChannels(null)
    setDropLineIndex(null)
    hasPendingOrderRef.current = false
  }, [reorderChannels])

  return (
    <Grid container item xs direction='column'>
      {dropLineIndex === 0 && <DropLine />}
      <Grid item>
        <SidebarHeader
          title={'Channels'}
          action={canCreateChannel ? createChannelModal.handleOpen : undefined}
          actionTitle={canCreateChannel ? createChannelModal.handleOpen : undefined}
          tooltipText='Create new channel'
        />
      </Grid>
      <Grid item>
        <List disablePadding data-testid='channelsList'>
          {displayChannels.map((channel, _index) => {
            const unread = unreadChannels.some(id => id === channel.id)
            const selected = currentChannelId === channel.id
            return (
              <React.Fragment key={channel.id}>
                {dropLineIndex === _index && _index > 0 && <DropLine />}
                <ChannelsListItem
                  channel={channel}
                  index={_index}
                  unread={unread}
                  selected={selected}
                  setCurrentChannel={setCurrentChannel}
                  startChannelDrag={startChannelDrag}
                  moveChannel={moveChannel}
                  endChannelDrag={endChannelDrag}
                  disabled={Boolean(channel.disabled)}
                />
              </React.Fragment>
            )
          })}
          {dropLineIndex === displayChannels.length && <DropLine />}
        </List>
      </Grid>
      <ChannelDragPreview />
      {/* <Grid item>
        <QuickActionButton
          text='Find Channel'
          action={}
          icon={<Icon src={SearchIcon} />}
        />
      </Grid> */}
    </Grid>
  )
}
export default ChannelsPanel
