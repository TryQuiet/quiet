import React, { useState } from 'react'
import { styled } from '@mui/material/styles'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Icon from '../ui/Icon/Icon'
import magnifyingGlassIcon from '../../static/images/magnifying-glass-icon.svg'
import closeIcon from '../../static/images/close-icon.svg'
import { PublicChannelStorage } from '@quiet/state-manager'
import Modal from '../ui/Modal/Modal'
import { useForm } from 'react-hook-form'
import { searchChannelField } from '../../forms/fields/searchChannelField'
import { TextInput } from '../../forms/components/textInput'

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
  wrapperRecent: `${PREFIX}wrapperRecent`
}

const StyledModalContent = styled(Grid)(({ theme }) => ({
  [`& .${classes.root}`]: {},
  [`& .${classes.overlay}`]: {
    width: '100%',
    height: '100%'
  },
  [`& .${classes.modalContainer}`]: {
    backgroundColor: '#FFFFFF',
    boxShadow: '0px 2px 25px rgba(0, 0, 0, 0.2)',
    borderRadius: '8px',
    width: '60%',
    overflow: 'hidden'
  },
  [`& .${classes.wrapper}`]: {
    padding: '24px'
  },
  [`& .${classes.wrapperRecent}`]: {
    padding: '16px 24px 8px'
  },
  [`& .${classes.magnifyingGlassIcon}`]: {
    width: 18,
    heigth: 18,
    justifyContent: 'center',
    marginRight: '16px'
  },
  [`& .${classes.closeIcon}`]: {
    width: 14,
    heigth: 14,
    justifyContent: 'center',
    cursor: 'pointer'
  },
  [`& .${classes.line}`]: {
    width: '100%',
    height: '1px',
    backgroundColor: theme.palette.colors.veryLightGray
  },
  [`& .${classes.channel}`]: {
    cursor: 'pointer',
    padding: '8px 24px',
    '&:hover': {
      backgroundColor: theme.palette.colors.lushSky,
      color: 'white'
    }
  },
  [`& .${classes.recentChannels}`]: {
    color: '#7F7F7F'
  },
  [`& .${classes.inputWrapper}`]: {
    display: 'flex'
  },

  [`& .${classes.input}`]: {
    caretColor: '#2288FF',
    '& div': {
      '&:hover': {
        border: 'none',
        '&::before': {
          border: 'none'
        }
      },
      '&::before': {
        border: 'none'
      },
      '&::after': {
        border: 'none'
      }
    }
  }
}))

const searchChannelFields = {
  searchChannel: searchChannelField()
}

export interface SearchModalComponentProps {
  open: boolean
  handleClose: () => void
  publicChannelsSelector: PublicChannelStorage[]
  setCurrentChannel: (address: string) => void
}

const SearchModalComponent: React.FC<SearchModalComponentProps> = ({
  open,
  handleClose,
  publicChannelsSelector,
  setCurrentChannel
}) => {
  const {
    formState: { errors }
  } = useForm<{ searchChannel: string }>({
    mode: 'onTouched'
  })

  const [channelInput, setChannelInput] = useState<string>('')

  const onChange = (value: string) => {
    setChannelInput(value)
  }

  const onChannelClickHandler = (address: string) => {
    setCurrentChannel(address)
    setChannelInput('')
    handleClose()
  }

  const closeHandler = () => {
    setChannelInput('')
    handleClose()
  }

  const recentChannels = publicChannelsSelector
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 3)

  const generalChannel = publicChannelsSelector.find(channel => channel.name === 'general')

  const filteredList = publicChannelsSelector.filter(channel => channel.name.includes(channelInput))

  const isFilteredList = filteredList.length > 0 ? filteredList : recentChannels

  const areThreeRecentChannels = recentChannels.length >= 3 ? recentChannels : [generalChannel]

  const channelList = channelInput.length === 0 ? areThreeRecentChannels : isFilteredList

  return (
    <Modal
      open={open}
      handleClose={handleClose}
      data-testid={'searchChannelModal'}
      contentWidth={'100wh'}
      isTransparent={true}>
      <StyledModalContent container direction='column' className={classes.root}>
        <Grid container justifyContent='center' alignItems='center' className={classes.overlay}>
          <Grid
            container
            item
            justifyContent='center'
            alignItems='center'
            className={classes.modalContainer}>
            <Grid
              container
              justifyContent='space-between'
              alignItems='center'
              item
              className={classes.wrapper}>
              <Grid
                item
                justifyContent='space-between'
                alignItems='center'
                className={classes.inputWrapper}>
                <Icon className={classes.magnifyingGlassIcon} src={magnifyingGlassIcon} />

                <TextInput
                  {...searchChannelFields.searchChannel.fieldProps}
                  fullWidth
                  variant='standard'
                  classes={classes.input}
                  placeholder={'Channel name'}
                  autoFocus
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

              <Icon className={classes.closeIcon} src={closeIcon} onClickHandler={closeHandler} />
            </Grid>

            <Grid className={classes.line} />

            <Grid container direction='column'>
              {channelInput.length === 0 && (
                <Grid className={classes.wrapperRecent}>
                  <Typography variant='overline' className={classes.recentChannels}>
                    Recent channels
                  </Typography>
                </Grid>
              )}

              {channelList.length > 0 &&
                channelList.map(item => {
                  return (
                    <div key={item.name} onClick={() => onChannelClickHandler(item.address)}>
                      <Typography variant='body2' className={classes.channel}>
                        # {item.name}
                      </Typography>
                    </div>
                  )
                })}
            </Grid>
          </Grid>
        </Grid>
      </StyledModalContent>
    </Modal>
  )
}

export default SearchModalComponent
