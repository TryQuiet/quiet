import React, { useEffect, useState } from 'react'

import { styled } from '@mui/material/styles'

import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'

import { useModal } from '../../../containers/hooks'
import Modal from '../../ui/Modal/Modal'
import { User, UserProfile } from '@quiet/types'
import { createTheme, TextField, Theme, ThemeProvider, useTheme } from '@mui/material'
import Autocomplete, {
  AutocompleteChangeDetails,
  AutocompleteChangeReason,
  autocompleteClasses,
} from '@mui/material/Autocomplete'
import { Box } from '../../ui'
import ProfilePhoto from '../../ProfilePhoto/ProfilePhoto'
import classNames from 'classnames'
import { createLogger } from '../../../logger'
import LockIcon from '../../../static/images/components/lock'

const logger = createLogger('AddMembersChannelComponent')

const PREFIX = 'AddMembersChannel'

const classes = {
  root: `${PREFIX}root`,
  titleContainer: `${PREFIX}titleContainer`,
  descContainer: `${PREFIX}descContainer`,
  iconContainer: `${PREFIX}iconContainer`,
  buttonContainer: `${PREFIX}buttonContainer`,
  button: `${PREFIX}button`,
  secondaryButtonContainer: `${PREFIX}secondaryButtonContainer`,
  secondaryButton: `${PREFIX}secondaryButton`,
  avatar: `${PREFIX}avatar`,
  username: `${PREFIX}username`,
  autocompleteBox: `${PREFIX}autocompleteBox`,
  autocompleteBoxSelected: `${PREFIX}autocompleteBoxSelected`,
}

const StyledGrid = styled(Grid)(({ theme }) => ({
  padding: '0px 32px',

  [`& .${classes.root}`]: {},

  [`& .${classes.titleContainer}`]: {
    marginTop: 16,
  },

  [`& .${classes.descContainer}`]: {
    marginTop: 8,
    marginLeft: 32,
    marginRight: 32,
    width: 100,
  },

  [`& .${classes.iconContainer}`]: {
    marginTop: 0,
  },

  [`& .${classes.buttonContainer}`]: {
    marginTop: 25,
  },

  [`& .${classes.button}`]: {
    width: 190,
    height: 60,
    color: theme.palette.colors.white,
    backgroundColor: theme.palette.colors.purple,
    padding: theme.spacing(2),
    '&:hover': {
      backgroundColor: theme.palette.colors.darkPurple,
    },
    '&:disabled': {
      backgroundColor: theme.palette.colors.gray,
    },
  },

  [`& .${classes.secondaryButtonContainer}`]: {
    marginTop: 16,
    marginBottom: 32,
  },

  [`& .${classes.secondaryButton}`]: {
    width: 160,
    height: 40,
    color: theme.palette.colors.darkGray,
    backgroundColor: theme.palette.colors.white,
    padding: theme.spacing(2),
    '&:hover': {
      boxShadow: 'none',
      cursor: 'pointer',
      backgroundColor: theme.palette.colors.white,
    },
  },

  [`& .${classes.avatar}`]: {
    width: theme.componentSizes.avatar.small,
    height: theme.componentSizes.avatar.small,
    marginRight: 0,
    paddingBottom: 0,
    borderRadius: 4,
    background: theme.palette.background.paper,
    marginBottom: 0,
    fontSize: '1rem',
    lineHeight: '1.68',
  },

  [`& .${classes.username}`]: {
    fontWeight: 400,
    paddingLeft: 0,
    paddingRight: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: 150,
    fontSize: '1rem',
    whiteSpace: 'nowrap',
    lineHeight: 1.68,
  },

  [`& .${classes.autocompleteBox}`]: {
    borderRadius: '8px',
    margin: '5px',
    [`&.${autocompleteClasses.option}`]: {
      padding: '8px',
    },
  },

  [`& .${classes.autocompleteBoxSelected}`]: {
    backgroundColor: theme.palette.colors.darkPurple,
  },
}))

export interface AddMembersChannelProps {
  channelName: string
  channelId: string
  allUsers: Record<string, User>
  possibleMembers: Record<string, UserProfile>
  addMembersToChannel: (memberIds: string[]) => void
}

interface AutoCompleteOption {
  id: string
  label: string
  index: number
  selected: boolean
}

export const AddMembersChannelComponent: React.FC<ReturnType<typeof useModal> & AddMembersChannelProps> = ({
  open,
  handleClose,
  channelName,
  channelId,
  possibleMembers,
  allUsers,
  addMembersToChannel,
}) => {
  const theme = useTheme()
  const [selectedMembers, setSelectedMembers] = useState<AutoCompleteOption[]>([])
  const [autoCompleteOptions, setAutoCompleteOptions] = useState<AutoCompleteOption[]>([])
  let initialized = false

  const _updateAutoCompleteOptions = () => {
    const updatedOptions: AutoCompleteOption[] = []
    let index = 0
    for (const user of Object.values(possibleMembers)) {
      if ((user.channels ?? []).includes(channelId)) {
        continue
      }
      updatedOptions.push({ label: user.nickname, id: user.userId, selected: false, index })
      index++
    }
    setAutoCompleteOptions(updatedOptions)
    initialized = true
  }

  useEffect(() => {
    if (open && !initialized) {
      _updateAutoCompleteOptions()
    } else if (!open) {
      setAutoCompleteOptions([])
      setSelectedMembers([])
      initialized = false
    }
  }, [open])

  const handleAddMembersToChannel = (): void => {
    addMembersToChannel(selectedMembers.map(option => option.id))
    setSelectedMembers([])
    setAutoCompleteOptions([])
  }

  const customTheme = (outerTheme: Theme) =>
    createTheme({
      palette: {
        mode: outerTheme.palette.mode,
      },
      components: {
        MuiAutocomplete: {
          defaultProps: {
            renderOption: (props, option, state) => {
              const { key, ...optionProps } = props as any
              const userProfile = possibleMembers[option.id]
              return (
                <Box
                  key={option.id}
                  classes={classNames(classes.autocompleteBox, {
                    [classes.autocompleteBoxSelected]: state.selected,
                  })}
                  component='li'
                  selected={state.selected}
                  data-testid={`${channelName}-add-members-autocomplete-option-${option.label}`}
                  {...optionProps}
                >
                  <Grid container item alignItems='center' direction='row' display='flex' gap='5px' padding='0px 0px'>
                    <ProfilePhoto
                      style={{
                        paddingBottom: 0,
                        padding: 0,
                        marginLeft: 0,
                        marginRight: 0,
                        marginBottom: 0,
                        fontSize: '1rem',
                        lineHeight: '1.68',
                        borderRadius: 4,
                      }}
                      className={classes.avatar}
                      userProfile={userProfile}
                      userId={userProfile.userId}
                      size={theme.componentSizes.avatar.small}
                      data-testid={`${channelName}-add-members-autocomplete-${option.label}-profilePhoto`}
                    />
                    <Typography
                      variant='body2'
                      className={classes.username}
                      data-testid={`${channelName}-add-members-autocomplete-${option.label}`}
                    >
                      {option.label}
                    </Typography>
                  </Grid>
                </Box>
              )
            },
          },
        },
      },
    })

  const handleAutoCompleteChange = (
    event: React.SyntheticEvent,
    selected: AutoCompleteOption[],
    reason: AutocompleteChangeReason,
    details?: AutocompleteChangeDetails<AutoCompleteOption>
  ) => {
    setSelectedMembers(selected.map(option => ({ ...option, selected: true })))
    if (reason === 'selectOption') {
      autoCompleteOptions[details!.option.index].selected = true
    } else if (reason === 'removeOption') {
      autoCompleteOptions[details!.option.index].selected = false
    }
    setAutoCompleteOptions(autoCompleteOptions)
  }

  const ChannelNameComponent: React.FC<{ channelName: string }> = ({ channelName }) => {
    return (
      <Grid
        style={{
          flexDirection: 'row',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'left',
          alignContent: 'center',
          paddingLeft: '2px',
        }}
        data-testid={`${channelName}-add-member-name`}
      >
        <LockIcon fill='currentColor' style={{ fontWeight: 500, fontSize: 16 }} />
        <span style={{ fontWeight: 500, fontSize: 16 }}>{channelName}</span>
      </Grid>
    )
  }

  return (
    <Modal open={open} handleClose={handleClose} fullPage={false}>
      <StyledGrid container justifyContent='center'>
        <Grid container item className={classes.descContainer} xs={12} direction='row' justifyContent='center'>
          <Typography align={'center'}>Add members to</Typography>
          <ChannelNameComponent channelName={channelName} />
          <Typography align={'center'}>:</Typography>
        </Grid>
        <StyledGrid container item direction='row' justifyContent='center' paddingTop='30px'>
          <ThemeProvider theme={customTheme(theme)}>
            <Autocomplete
              multiple
              autoHighlight
              limitTags={3}
              options={autoCompleteOptions}
              sx={{ width: 300 }}
              renderInput={params => <TextField {...params} label='Add members' />}
              onChange={handleAutoCompleteChange}
              data-testid={`${channelName}-add-members-autocomplete`}
            />
          </ThemeProvider>
        </StyledGrid>
        <Grid item xs={'auto'} className={classes.buttonContainer}>
          <Button
            variant='contained'
            onClick={handleAddMembersToChannel}
            size='small'
            fullWidth
            className={classes.button}
            data-testid={`${channelName}-add-members-button`}
          >
            Add {selectedMembers.length} members
          </Button>
        </Grid>
        <Grid
          container
          item
          className={classes.secondaryButtonContainer}
          xs={12}
          direction='row'
          justifyContent='center'
        >
          <Button
            variant='contained'
            onClick={handleClose}
            size='small'
            fullWidth
            className={classes.secondaryButton}
            data-testid={`${channelName}-add-members-leave-button`}
          >
            Nevermind
          </Button>
        </Grid>
      </StyledGrid>
    </Modal>
  )
}

export default AddMembersChannelComponent
