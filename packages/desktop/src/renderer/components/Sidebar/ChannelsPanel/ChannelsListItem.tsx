import React, { useEffect, useRef } from 'react'
import { styled } from '@mui/material/styles'
import classNames from 'classnames'
import { Typography, Grid, ListItemButton, useTheme } from '@mui/material'
import ListItemText from '@mui/material/ListItemText'
import { PublicChannel } from '@quiet/types'
import ChannelTypeIcon from '../../widgets/channels/ChannelTypeIcon'
import { useDrag, useDrop } from 'react-dnd'
import type { XYCoord } from 'dnd-core'
import { getEmptyImage } from 'react-dnd-html5-backend'

const PREFIX = 'ChannelsListItem'
const CHANNEL_LIST_ITEM_TYPE = 'CHANNEL_LIST_ITEM'

const classes = {
  root: `${PREFIX}root`,
  selected: `${PREFIX}selected`,
  primary: `${PREFIX}primary`,
  title: `${PREFIX}title`,
  titlePublic: `${PREFIX}titlePublic`,
  newMessages: `${PREFIX}newMessages`,
  connectedIcon: `${PREFIX}connectedIcon`,
  notConnectedIcon: `${PREFIX}notConnectedIcon`,
  itemText: `${PREFIX}itemText`,
  disabled: `${PREFIX}disabled`,
  lock: `${PREFIX}lock`,
  lockNewMessages: `${PREFIX}lockNewMessages`,
}

interface DraggedChannel {
  id: string
  index: number
  name: string
  isPublic: boolean
  unread: boolean
}

const StyledListItemButton = styled(ListItemButton)(({ theme }) => ({
  [`&.${classes.root}`]: {
    width: 220,
    height: 'hug',
    padding: `3px 0px 3px 0px`,
    gap: 4,
    opacity: 1,
    display: 'flex',
    backgroundColor: 'inherit',
  },

  [`&.${classes.root}:hover`]: {
    backgroundColor: theme.palette.colors.sidebarHover,
  },

  [`&.${classes.selected}`]: {
    backgroundColor: theme.palette.colors.sidebarSelected,
  },

  [`& .${classes.primary}`]: {
    display: 'flex',
  },

  [`& .${classes.title}`]: {
    opacity: 0.7,
    fontWeight: 300,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: 215,
    whiteSpace: 'nowrap',
    textTransform: 'lowercase',
  },

  [`& .${classes.titlePublic}`]: {
    paddingLeft: 16,
    paddingRight: 2,
  },

  [`& .${classes.newMessages}`]: {
    opacity: 1,
    fontWeight: 600,
  },

  [`& .${classes.lock}`]: {
    opacity: 0.7,
    marginLeft: 13.5,
    marginRight: 0,
    fontWeight: 300,
    paddingRight: 2,
  },

  [`& .${classes.lockNewMessages}`]: {
    opacity: 1,
    fontWeight: 600,
  },

  [`& .${classes.connectedIcon}`]: {
    marginLeft: 16,
    marginRight: -8,
    width: 11,
    height: 11,
  },

  [`& .${classes.notConnectedIcon}`]: {
    marginLeft: 16,
    marginRight: -8,
    width: 11,
    height: 11,
    opacity: 0.5,
  },

  [`& .${classes.itemText}`]: {
    margin: 0,
  },
  [`&.${classes.disabled}`]: {
    opacity: '0.3',
    pointerEvents: 'none',
    cursor: 'not-allowed',
  },
}))

export interface ChannelsListItemProps {
  channel: PublicChannel
  index: number
  unread: boolean
  selected: boolean
  setCurrentChannel: (name: string) => void
  startChannelDrag: (index: number, channelId: string) => void
  moveChannel: (dragIndex: number, dropIndex: number, clientOffset: XYCoord | null) => number
  endChannelDrag: () => void
  disabled: boolean
}

export const ChannelsListItem: React.FC<ChannelsListItemProps> = ({
  channel,
  index,
  unread,
  selected,
  setCurrentChannel,
  startChannelDrag,
  moveChannel,
  endChannelDrag,
  disabled = false,
}) => {
  const theme = useTheme()
  const ref = useRef<HTMLDivElement>(null)
  const isPublic = channel.public ?? true
  const [{ isDragging }, drag, preview] = useDrag(
    () => ({
      type: CHANNEL_LIST_ITEM_TYPE,
      item: () => {
        startChannelDrag(index, channel.id)
        return { id: channel.id, index, name: channel.name, isPublic, unread }
      },
      canDrag: !disabled,
      end: () => {
        endChannelDrag()
      },
      collect: monitor => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [channel.id, channel.name, disabled, endChannelDrag, index, isPublic, startChannelDrag, unread]
  )

  useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true })
  }, [preview])

  const [, drop] = useDrop(
    () => ({
      accept: CHANNEL_LIST_ITEM_TYPE,
      hover: (item: DraggedChannel, monitor) => {
        const clientOffset = monitor.getClientOffset()
        if (!ref.current || item.id === channel.id || !clientOffset) return

        const hoverBoundingRect = ref.current.getBoundingClientRect()
        const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2
        const hoverClientY = clientOffset.y - hoverBoundingRect.top
        const dropIndex = hoverClientY > hoverMiddleY ? index + 1 : index

        item.index = moveChannel(item.index, dropIndex, clientOffset)
      },
    }),
    [channel.id, index, moveChannel]
  )

  drag(drop(ref))

  return (
    <StyledListItemButton
      ref={ref}
      disableGutters
      onClick={() => {
        setCurrentChannel(channel.id)
      }}
      className={classNames(classes.root, {
        [classes.selected]: selected,
        [classes.disabled]: disabled,
      })}
      style={isDragging ? { opacity: 0.4 } : undefined}
      data-testid={`${channel.name}-link`}
    >
      <ListItemText
        primary={
          <Grid container alignItems='center'>
            <Grid container alignItems='center' direction='row' gap='1px' display='flex'>
              <ChannelTypeIcon
                isPublic={isPublic}
                fill={'currentColor'}
                style={{ ...theme.typography.subtitle1 }}
                className={classNames(classes.lock, {
                  [classes.lockNewMessages]: unread,
                })}
                data-testid={`${channel.name}-channel-link-icon-${isPublic ? 'public' : 'private'}`}
              />
              <Typography
                variant='body2'
                className={classNames(classes.title, {
                  [classes.newMessages]: unread,
                })}
                data-testid={`${channel.name}-channel-link-text`}
              >
                {channel.name}
              </Typography>
            </Grid>
          </Grid>
        }
        classes={{
          primary: classes.primary,
        }}
        className={classes.itemText}
      />
    </StyledListItemButton>
  )
}

export default ChannelsListItem
