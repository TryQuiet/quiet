import React from 'react'
import { styled } from '@mui/material/styles'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Icon from '../ui/Icon/Icon'
import magnifyingGlassIcon from '../../static/images/magnifying-glass-icon.svg'
import closeIcon from '../../static/images/close-icon.svg'
import { PublicChannelStorage } from '@quiet/types'
import Modal from '../ui/Modal/Modal'
import { useForm } from 'react-hook-form'
import { searchChannelField } from '../../forms/fields/searchChannelField'
import { TextField } from '../ui/TextField/TextField'
import { useCyclingFocus, Variant } from '../../containers/hooks'
import ChannelItem from './ChannelItem'
import { rowHover } from '../../design-system/theme/components'

const PREFIX = 'SearchModalComponent'

const classes = {
  root: `${PREFIX}root`,
  modalContainer: `${PREFIX}modalContainer`,
  overlay: `${PREFIX}overlay`,
  wrapper: `${PREFIX}wrapper`,
  magnifyingGlassIcon: `${PREFIX}magnifyingGlassIcon`,
  closeIcon: `${PREFIX}closeIcon`,
  line: `${PREFIX}line`,
  input: `${PREFIX}input`,
  channel: `${PREFIX}channel`,
  recentChannels: `${PREFIX}recentChannels`,
  inputWrapper: `${PREFIX}inputWrapper`,
  wrapperRecent: `${PREFIX}wrapperRecent`,
  channelWrapper: `${PREFIX}channelWrapper`,
  channelWrapperSelected: `${PREFIX}channelWrapperSelected`,
  scrollContainer: `${PREFIX}scrollContainer`,
}

const StyledModalContent = styled(Grid)(({ theme }) => ({
  [`& .${classes.root}`]: {},
  [`& .${classes.overlay}`]: {
    width: '100%',
    height: '100%',
  },
  [`& .${classes.modalContainer}`]: {
    backgroundColor: theme.palette.background.default,
    boxShadow: theme.shadows[4],
    borderRadius: '8px',
    width: '60%',
    overflow: 'hidden',
    minHeight: '255px',
  },
  // 'Search bar' (library 3797:17977): 16 padding, 24px search and close glyphs; rows are 'Search result'
  // (3799:12467): 8/16 padding, hover a 6% wash, selected #1B6FEC with white text.
  [`& .${classes.wrapper}`]: {
    padding: theme.space.lg,
  },
  [`& .${classes.wrapperRecent}`]: {
    padding: `${theme.space.lg}px ${theme.space.lg}px ${theme.space.sm}px`,
  },
  [`& .${classes.magnifyingGlassIcon}`]: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    marginRight: theme.space.lg,
  },
  [`& .${classes.closeIcon}`]: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    cursor: 'pointer',
  },
  [`& .${classes.line}`]: {
    width: '100%',
    height: '1px',
    backgroundColor: theme.palette.background.paper,
  },
  [`& .${classes.channel}`]: {},
  [`& .${classes.channelWrapper}`]: {
    border: '0',
    cursor: 'pointer',
    padding: `${theme.space.sm}px ${theme.space.lg}px`,
    '&:hover': {
      backgroundColor: rowHover(theme),
    },
    '&:focus': {
      backgroundColor: theme.palette.colors.linkBlue,
      color: theme.palette.colors.white,
    },
    '&:focus-visible': {
      outline: '0',
    },
  },
  [`& .${classes.channelWrapperSelected}`]: {
    backgroundColor: theme.palette.colors.linkBlue,
    color: theme.palette.colors.white,
    '&:focus-visible': {
      outline: '0',
    },
  },
  [`& .${classes.recentChannels}`]: {
    color: theme.palette.colors.gray50,
  },
  [`& .${classes.inputWrapper}`]: {
    display: 'flex',
  },
  [`& .${classes.scrollContainer}`]: {
    // I will back to this idea
    // overflowY: 'scroll',
    // height: '170px'
  },
  [`& .${classes.input}`]: {
    minWidth: '250px',
    caretColor: theme.palette.colors.linkBlue,
    '& div': {
      '&:hover': {
        border: 'none',
        '&::before': {
          border: 'none',
        },
      },
      '&::before': {
        border: 'none',
      },
      '&::after': {
        border: 'none',
      },
    },
  },
}))

const searchChannelFields = {
  searchChannel: searchChannelField(),
}

export interface SearchModalComponentProps {
  open: boolean
  handleClose: () => void
  setCurrentChannel: (address: string) => void
  setChannelInput: (value: React.SetStateAction<string>) => void
  dynamicSearchedChannelsSelector: PublicChannelStorage[]
  unreadChannelsSelector: string[]
  publicChannelsSelector: PublicChannelStorage[]
  channelInput: string
}

const SearchModalComponent: React.FC<SearchModalComponentProps> = ({
  open,
  handleClose,
  setCurrentChannel,
  setChannelInput,
  dynamicSearchedChannelsSelector,
  unreadChannelsSelector,
  publicChannelsSelector,
  channelInput,
}) => {
  const {
    formState: { errors },
  } = useForm<{ searchChannel: string }>({
    mode: 'onChange',
  })

  const unreadChannels = publicChannelsSelector.filter(channel => unreadChannelsSelector.includes(channel.id))

  const unread = unreadChannels.length > 0

  const channelList = unread && channelInput.length === 0 ? unreadChannels : dynamicSearchedChannelsSelector

  const onChannelClickHandler = (id: string) => {
    setChannelInput('')
    setCurrentFocus(0)
    setCurrentChannel(id)
  }

  const [focusedIndex, setCurrentFocus] = useCyclingFocus(channelList.length, Variant.ARROWS_KEYS, 0)

  const onChange = (value: string) => {
    setChannelInput(value)
  }

  const closeHandler = () => {
    setCurrentFocus(0)
    setChannelInput('')
    handleClose()
  }

  return (
    <Modal
      open={open}
      handleClose={closeHandler}
      data-testid={'searchChannelModal'}
      contentWidth={'100wh'}
      isTransparent={true}
    >
      <StyledModalContent container direction='column' className={classes.root}>
        <Grid container justifyContent='center' alignItems='center' className={classes.overlay}>
          <Grid item justifyContent='flex-start' alignItems='center' className={classes.modalContainer}>
            <Grid container justifyContent='space-between' alignItems='center' item className={classes.wrapper}>
              <Grid item justifyContent='space-between' alignItems='center' className={classes.inputWrapper}>
                <Icon className={classes.magnifyingGlassIcon} src={magnifyingGlassIcon} />

                <TextField
                  {...searchChannelFields.searchChannel.fieldProps}
                  fullWidth
                  variant='standard'
                  classes={classes.input}
                  placeholder={'Channel name'}
                  autoFocus
                  focused={true}
                  errors={errors}
                  onchange={event => {
                    event.persist()
                    const value = event.target.value
                    onChange(value)
                  }}
                  onblur={() => {}}
                  value={channelInput}
                  data-testid={'searchChannelInput'}
                />
              </Grid>

              <Icon data-tag='TagValue' className={classes.closeIcon} src={closeIcon} onClickHandler={closeHandler} />
            </Grid>

            <Grid className={classes.line} />

            <Grid container direction='column'>
              {channelInput.length === 0 && (
                <Grid className={classes.wrapperRecent}>
                  <Typography variant='overline' className={classes.recentChannels}>
                    {unread ? 'unread messages' : 'recent channels'}
                  </Typography>
                </Grid>
              )}
              <Grid direction='column' className={channelList.length > 3 ? classes.scrollContainer : ''}>
                {channelList.length > 0 &&
                  channelList.map((item, index) => {
                    return (
                      <ChannelItem
                        className={classes.channelWrapper}
                        focused={focusedIndex === index}
                        classNameSelected={classes.channelWrapperSelected}
                        item={item}
                        key={index}
                        onClickHandler={onChannelClickHandler}
                        channelInput={channelInput}
                      />
                    )
                  })}
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </StyledModalContent>
    </Modal>
  )
}

export default SearchModalComponent
