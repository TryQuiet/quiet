import React, { useState } from 'react'
import { styled } from '@mui/material/styles'
import classNames from 'classnames'

import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'

import WarningIcon from '@mui/icons-material/Warning'

import Modal from '../ui/Modal/Modal'
import { LoadingButton } from '../ui/LoadingButton/LoadingButton'

import {
  CreateCommunityDictionary,
  JoinCommunityDictionary
} from '../CreateJoinCommunity/community.dictionary'

import { parseName, CommunityOwnership } from '@quiet/state-manager'
import { ipcRenderer } from 'electron'

import { Controller, useForm } from 'react-hook-form'
import { TextInput } from '../../forms/components/textInput'
import { InviteLinkErrors } from '../../forms/fieldsErrors'
import { IconButton, InputAdornment } from '@mui/material'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import Visibility from '@mui/icons-material/Visibility'
import { DOMAIN, InvitationParams, ONION_ADDRESS_LENGTH } from '../../../shared/static'

const PREFIX = 'PerformCommunityActionComponent'

const classes = {
  focus: `${PREFIX}focus`,
  margin: `${PREFIX}margin`,
  error: `${PREFIX}error`,
  fullContainer: `${PREFIX}fullContainer`,
  gutter: `${PREFIX}gutter`,
  button: `${PREFIX}button`,
  title: `${PREFIX}title`,
  iconDiv: `${PREFIX}iconDiv`,
  warrningIcon: `${PREFIX}warrningIcon`,
  warrningMessage: `${PREFIX}warrningMessage`,
  rootBar: `${PREFIX}rootBar`,
  progressBar: `${PREFIX}progressBar`,
  info: `${PREFIX}info`
}

const StyledModalContent = styled(Grid)((
  {
    theme
  }
) => ({
    backgroundColor: theme.palette.colors.white,
    padding: '0px 32px',

  [`& .${classes.focus}`]: {
    '& .MuiOutlinedInput-root': {
      '&.Mui-focused fieldset': {
        borderColor: theme.palette.colors.linkBlue
      }
    }
  },

  [`& .${classes.margin}`]: {
    '& .MuiFormHelperText-contained': {
      margin: '5px 0px'
    }
  },

  [`& .${classes.error}`]: {
    '& .MuiOutlinedInput-root': {
      '&.Mui-focused fieldset': {
        borderColor: theme.palette.colors.red
      }
    }
  },

  [`& .${classes.fullContainer}`]: {
    width: '100%'
  },

  [`& .${classes.gutter}`]: {
    marginTop: 8,
    marginBottom: 24
  },

  [`& .${classes.button}`]: {
    width: 165,
    backgroundColor: theme.palette.colors.quietBlue,
    color: theme.palette.colors.white,
    '&:hover': {
      backgroundColor: theme.palette.colors.quietBlue
    },
    textTransform: 'none',
    height: 48,
    fontWeight: 'normal'
  },

  [`& .${classes.title}`]: {
    marginBottom: 24
  },

  [`& .${classes.iconDiv}`]: {
    width: 24,
    height: 28,
    marginRight: 8
  },

  [`& .${classes.warrningIcon}`]: {
    color: '#FFCC00'
  },

  [`& .${classes.warrningMessage}`]: {
    wordBreak: 'break-word'
  },

  [`& .${classes.rootBar}`]: {
    width: 350,
    marginTop: 32,
    marginBottom: 16
  },

  [`& .${classes.progressBar}`]: {
    backgroundColor: theme.palette.colors.linkBlue
  },

  [`& .${classes.info}`]: {
    lineHeight: '19px',
    color: theme.palette.colors.darkGray
  }
}))

interface PerformCommunityActionFormValues {
  name: string
}

export interface PerformCommunityActionProps {
  open: boolean
  communityOwnership: CommunityOwnership
  handleCommunityAction: (value: string) => void
  handleRedirection: () => void
  handleClose: () => void
  isConnectionReady?: boolean
  isCloseDisabled: boolean
  hasReceivedResponse: boolean
  revealInputValue?: boolean
  handleClickInputReveal?: () => void
}

export const PerformCommunityActionComponent: React.FC<PerformCommunityActionProps> = ({
  open,
  communityOwnership,
  handleCommunityAction,
  handleRedirection,
  handleClose,
  isConnectionReady = true,
  isCloseDisabled,
  hasReceivedResponse,
  revealInputValue,
  handleClickInputReveal
}) => {
  const [formSent, setFormSent] = useState(false)
  const [communityName, setCommunityName] = useState('')
  const [parsedNameDiffers, setParsedNameDiffers] = useState(false)
  const waitingForResponse = formSent && !hasReceivedResponse

  const dictionary =
    communityOwnership === CommunityOwnership.Owner
      ? CreateCommunityDictionary(handleRedirection)
      : JoinCommunityDictionary(handleRedirection)

  const {
    handleSubmit,
    formState: { errors },
    setValue,
    setError,
    control
  } = useForm<PerformCommunityActionFormValues>({
    mode: 'onTouched'
  })

  const onSubmit = (values: PerformCommunityActionFormValues) =>
    submitForm(handleCommunityAction, values, setFormSent)

  const getCode = (value: string): string => {
    let code: string
    let validUrl: URL
    try {
      validUrl = new URL(value)
    } catch (e) {
      code = value
    }

    if (validUrl && validUrl.host === DOMAIN && validUrl.pathname === '/join') {
      if (validUrl.searchParams.has(InvitationParams.CODE)) {
        code = validUrl.searchParams.get(InvitationParams.CODE)
      }
    }
    return code
  }

  const submitForm = (
    handleSubmit: (value: string) => void,
    values: PerformCommunityActionFormValues,
    setFormSent
  ) => {
    let submitValue =
      communityOwnership === CommunityOwnership.Owner ? parseName(values.name) : values.name.trim()

    if (CommunityOwnership.User) {
      submitValue = getCode(submitValue)
      // TODO: maybe unify error message?
      if (submitValue.length < ONION_ADDRESS_LENGTH) {
        setError('name', { message: InviteLinkErrors.ValueTooShort })
        return
      }
  
      if (submitValue.length > ONION_ADDRESS_LENGTH) {
        setError('name', { message: InviteLinkErrors.ValueTooLong })
        return
      }
    }

    setFormSent(true)
    handleSubmit(submitValue)
  }

  const onChange = (name: string) => {
    if (communityOwnership === CommunityOwnership.User) return
    // Check community name against naming policy if user creates community
    const parsedName = parseName(name)
    setCommunityName(parsedName)
    setParsedNameDiffers(name !== parsedName)
  }

  React.useEffect(() => {
    if (!open) {
      setValue('name', '')
      setCommunityName('')
    }
  }, [open])

  return (
    <Modal open={open} handleClose={handleClose} isCloseDisabled={isCloseDisabled}>
      <StyledModalContent container direction='column'>
        <>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid
              container
              justifyContent='flex-start'
              direction='column'
              className={classes.fullContainer}>
              <Typography variant='h3' className={classes.title}>
                {dictionary.header}
              </Typography>
              <Typography variant='body2'>{dictionary.label}</Typography>
              <Controller
                control={control}
                defaultValue={''}
                rules={dictionary.field.validation}
                name={'name'}
                render={({ field }) => (
                  <TextInput
                    {...dictionary.field.fieldProps}
                    fullWidth
                    classes={classNames({
                      [classes.focus]: true,
                      [classes.margin]: true,
                      [classes.error]: errors.name
                    })}
                    placeholder={dictionary.placeholder}
                    errors={errors}
                    variant='outlined'
                    onchange={event => {
                      event.persist()
                      const value = event.target.value
                      onChange(value)
                      // Call default
                      field.onChange(event)
                    }}
                    onblur={() => {}}
                    InputProps={communityOwnership === CommunityOwnership.User
                      ? {
                        endAdornment: (
                          <InputAdornment position='end'>
                            <IconButton
                              size='small'
                              onClick={handleClickInputReveal}
                            >
                              {!revealInputValue ? (
                                <VisibilityOff color='primary' fontSize='small' />
                              ) : (
                                <Visibility color='primary' fontSize='small' />
                              )}
                            </IconButton>
                          </InputAdornment>
                        )
                      } : <></>}
                    type={revealInputValue ? 'text' : 'password'}
                    value={communityOwnership === CommunityOwnership.User ? field.value.trim() : field.value}
                  />
                )}
              />
            </Grid>
            <div className={classes.gutter}>
              {!errors.name && communityName.length > 0 && parsedNameDiffers && (
                <Grid container alignItems='center' direction='row'>
                  <Grid item className={classes.iconDiv}>
                    <WarningIcon className={classes.warrningIcon} />
                  </Grid>
                  <Grid item xs>
                    <Typography
                      variant='body2'
                      className={classes.warrningMessage}
                      data-testid={'createCommunityNameWarning'}>
                      Your community will be created as <b>{`#${communityName}`}</b>
                    </Typography>
                  </Grid>
                </Grid>
              )}
            </div>
            <div className={classes.gutter}>
              <Grid container alignItems='center' direction='row'>
                {dictionary.redirection}
              </Grid>
            </div>
            <LoadingButton
              type='submit'
              variant='contained'
              size='small'
              color='primary'
              fullWidth
              text={dictionary.button ?? 'Continue'}
              data-testid={`continue-${dictionary.id}`}
              classes={{ button: classes.button }}
              inProgress={waitingForResponse}
              disabled={!isConnectionReady}
            />
          </form>
        </>
      </StyledModalContent>
    </Modal>
  )
}

export default PerformCommunityActionComponent
