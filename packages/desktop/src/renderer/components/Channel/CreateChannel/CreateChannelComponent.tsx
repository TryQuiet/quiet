import React, { useState } from 'react'
import { styled } from '@mui/material/styles'
import { Controller, useForm } from 'react-hook-form'
import { Grid, Typography } from '@mui/material'
import Drawer from '../../ui/Drawer/Drawer'
import PanelHeader, { PANEL_WIDTH } from '../../ui/Panel/PanelHeader'
import PanelBlock from '../../ui/Panel/PanelBlock'
import PanelRow from '../../ui/Panel/PanelRow'
import WarningIcon from '@mui/icons-material/Warning'

import { parseName } from '@quiet/common'

import LoadingButton from '../../ui/LoadingButton/LoadingButton'
import { TextField } from '../../ui/TextField/TextField'
import { channelNameField, channelPrivateField } from '../../../forms/fields/createChannelFields'
import { createLogger } from '../../../logger'
import IOSSwitch from '../../ui/Switch/IOSSwitch'
import LockIcon from '../../../static/images/components/lock'

const logger = createLogger('CreateChannelComponent')

const PREFIX = 'CreateChannelComponent'

const classes = {
  button: `${PREFIX}button`,
  iconDiv: `${PREFIX}iconDiv`,
  warningIcon: `${PREFIX}warningIcon`,
  warningMessage: `${PREFIX}warningMessage`,
  errorMessage: `${PREFIX}errorMessage`,
  lock: `${PREFIX}lock`,
}

// No gutter here on purpose: the design lays rows edge to edge and insets only the blocks, so the
// padding belongs to PanelBlock and PanelRow rather than to the column that holds them.
const StyledPanelContent = styled('div')(({ theme }) => ({
  backgroundColor: theme.palette.background.default,

  // The design hugs the label and sits the button against the block's left edge; size, radius and
  // the primary colours come from the theme's Button spec.
  [`& .${classes.button}`]: {
    alignSelf: 'flex-start',
  },

  [`& .${classes.iconDiv}`]: {
    width: 24,
    height: 28,
    marginRight: 8,
  },

  [`& .${classes.warningIcon}`]: {
    color: theme.palette.warning.main,
  },

  [`& .${classes.warningMessage}`]: {
    wordBreak: 'break-word',
  },

  [`& .${classes.errorMessage}`]: {
    color: theme.palette.error.main,
    fontSize: 12,
  },

  [`& .${classes.lock}`]: {
    padding: 0,
  },
}))

/** The toggle's DOM id, so its row can be its <label>. */
const PRIVATE_TOGGLE_ID = 'createChannel-private-toggle'

const createChannelFields = {
  channelName: channelNameField(),
  private: channelPrivateField(),
}

interface CreateChannelFormValues {
  channelName: string
  private: boolean
}

export interface CreateChannelProps {
  open: boolean
  channelCreationError?: string
  canCreateChannel: boolean
  canCreatePrivateChannel: boolean
  createChannel: (name: string, isPublic: boolean) => void
  handleClose: () => void
  clearErrorsDispatch: () => void
}

export const CreateChannelComponent: React.FC<CreateChannelProps> = ({
  open,
  channelCreationError,
  canCreateChannel,
  canCreatePrivateChannel,
  createChannel,
  handleClose,
  clearErrorsDispatch,
}) => {
  const [channelName, setChannelName] = useState('')
  const [parsedNameDiffers, setParsedNameDiffers] = useState(false)

  const { handleSubmit, formState, setValue, setError, clearErrors, control } = useForm<{
    channelName: string
    private: boolean
  }>({
    mode: 'onSubmit',
  })

  const onSubmit = (values: CreateChannelFormValues) => {
    submitForm(createChannel, values)
  }

  const submitForm = (handleSubmit: (name: string, isPublic: boolean) => void, values: CreateChannelFormValues) => {
    handleSubmit(parseName(values.channelName), !values.private)
  }

  const onNameChange = (name: string) => {
    setValue('channelName', name)
    const parsedName = parseName(name)
    setChannelName(parsedName)
    setParsedNameDiffers(name !== parsedName)
  }

  const onIsPrivateChange = (checked: boolean) => {
    setValue('private', checked)
  }

  React.useEffect(() => {
    if (!open) {
      setValue('channelName', '')
      setChannelName('')
      setValue('private', false)
      clearErrors()
      clearErrorsDispatch()
    } else {
      setValue('private', false)
    }
  }, [open])

  React.useEffect(() => {
    if (channelCreationError) {
      setError('channelName', { message: channelCreationError })
    }
  }, [channelCreationError])

  return (
    <>
      {canCreateChannel && (
        <Drawer
          open={open}
          onClose={handleClose}
          anchor='right'
          data-testid={'createChannelPanel'}
          PaperProps={{ sx: { width: PANEL_WIDTH } }}
        >
          <StyledPanelContent>
            <PanelHeader
              title='Create channel'
              handleClose={handleClose}
              closeTestId={'createChannelPanelClose'}
              titleTestId={'createChannelPanelTitle'}
            />
            <form
              onSubmit={handleSubmit(onSubmit, errors => {
                logger.error(
                  'Errors on submit',
                  JSON.stringify(errors.channelName, null, 2),
                  JSON.stringify(errors.private, null, 2)
                )
              })}
            >
              <PanelBlock>
                <Controller
                  control={control}
                  defaultValue={''}
                  rules={createChannelFields.channelName.validation}
                  name={'channelName'}
                  render={({ field }) => (
                    <TextField
                      {...createChannelFields.channelName.fieldProps}
                      fullWidth
                      classes={''}
                      variant='outlined'
                      title='Channel name'
                      placeholder={'Enter a channel name'}
                      autoFocus
                      errors={formState.errors}
                      onchange={event => {
                        event.persist()
                        const value = event.target.value
                        onNameChange(value)
                        // Call default
                        field.onChange(event)
                      }}
                      onblur={() => {
                        field.onBlur()
                      }}
                      value={field.value}
                      data-testid={'createChannelInput'}
                    />
                  )}
                />
                {!formState.errors.channelName && channelName.length > 0 && parsedNameDiffers && (
                  <Grid container alignItems='center' direction='row'>
                    <Grid item className={classes.iconDiv}>
                      <WarningIcon className={classes.warningIcon} />
                    </Grid>
                    <Grid item xs>
                      <Typography
                        variant='body2'
                        className={classes.warningMessage}
                        data-testid={'createChannelNameWarning'}
                      >
                        Your channel will be created as <b>{`#${channelName}`}</b>
                      </Typography>
                    </Grid>
                  </Grid>
                )}
              </PanelBlock>
              {canCreatePrivateChannel && (
                <>
                  <Controller
                    control={control}
                    name={'private'}
                    rules={createChannelFields.private.validation}
                    render={({ field }) => (
                      <PanelRow
                        testIdPrefix={'createChannel-private'}
                        // The row is the toggle's label, so pressing the words works as well as
                        // pressing the switch, and a screen reader names the switch by the row.
                        htmlFor={PRIVATE_TOGGLE_ID}
                        icon={<LockIcon className={classes.lock} data-testid={'createChannel-private-lockIcon'} />}
                        title={'Private channel'}
                        subtitle={'Only assigned members and admins have access'}
                        control={
                          <IOSSwitch
                            id={PRIVATE_TOGGLE_ID}
                            checked={field.value}
                            data-testid={'createChannel-private-form-control-toggle'}
                            onChange={event => {
                              event.persist()
                              onIsPrivateChange(event.target.checked)
                              field.onChange(event.target.checked)
                            }}
                          />
                        }
                      />
                    )}
                  />
                  {formState.errors.private && (
                    <PanelBlock>
                      <Typography
                        variant='body2'
                        className={classes.errorMessage}
                        data-testid={'createChannelPrivacyWarning'}
                      >
                        {formState.errors.private.message}
                      </Typography>
                    </PanelBlock>
                  )}
                </>
              )}
              <PanelBlock>
                <LoadingButton
                  variant='contained'
                  color='primary'
                  type='submit'
                  text='Create channel'
                  classes={{ button: classes.button }}
                  data-testid='channelNameSubmit'
                />
              </PanelBlock>
            </form>
          </StyledPanelContent>
        </Drawer>
      )}
    </>
  )
}

export default CreateChannelComponent
