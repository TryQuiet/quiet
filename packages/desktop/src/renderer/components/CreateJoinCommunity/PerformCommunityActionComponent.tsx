import React, { useEffect, useState } from 'react'
import { styled } from '@mui/material/styles'
import classNames from 'classnames'

import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'

import WarningIcon from '@mui/icons-material/Warning'

import Modal from '../ui/Modal/Modal'
import { LoadingButton } from '../ui/LoadingButton/LoadingButton'

import { CreateCommunityDictionary, JoinCommunityDictionary } from '../CreateJoinCommunity/community.dictionary'

import { CommunityOwnership, InvitationData, InvitationPair } from '@quiet/types'

import { Controller, useForm } from 'react-hook-form'
import { TextInput } from '../../forms/components/textInput'
import { InviteLinkErrors } from '../../forms/fieldsErrors'
import { IconButton, InputAdornment } from '@mui/material'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import Visibility from '@mui/icons-material/Visibility'
import { ONION_ADDRESS_REGEX, composeInvitationShareUrl, parseName } from '@quiet/common'
import { getInvitationCodes } from '@quiet/state-manager'

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
  info: `${PREFIX}info`,
}

const StyledModalContent = styled(Grid)(({ theme }) => ({
  backgroundColor: theme.palette.colors.white,
  padding: '0px 32px',

  [`& .${classes.focus}`]: {
    '& .MuiOutlinedInput-root': {
      '&.Mui-focused fieldset': {
        borderColor: theme.palette.colors.linkBlue,
      },
    },
  },

  [`& .${classes.margin}`]: {
    '& .MuiFormHelperText-contained': {
      margin: '5px 0px',
    },
  },

  [`& .${classes.error}`]: {
    '& .MuiOutlinedInput-root': {
      '&.Mui-focused fieldset': {
        borderColor: theme.palette.colors.red,
      },
    },
  },

  [`& .${classes.fullContainer}`]: {
    width: '100%',
  },

  [`& .${classes.gutter}`]: {
    marginTop: 8,
    marginBottom: 24,
  },

  [`& .${classes.button}`]: {
    width: 165,
    backgroundColor: theme.palette.colors.quietBlue,
    color: theme.palette.colors.white,
    '&:hover': {
      backgroundColor: theme.palette.colors.quietBlue,
    },
    textTransform: 'none',
    height: 48,
    fontWeight: 'normal',
  },

  [`& .${classes.title}`]: {
    marginBottom: 24,
  },

  [`& .${classes.iconDiv}`]: {
    width: 24,
    height: 28,
    marginRight: 8,
  },

  [`& .${classes.warrningIcon}`]: {
    color: '#FFCC00',
  },

  [`& .${classes.warrningMessage}`]: {
    wordBreak: 'break-word',
  },

  [`& .${classes.rootBar}`]: {
    width: 350,
    marginTop: 32,
    marginBottom: 16,
  },

  [`& .${classes.progressBar}`]: {
    backgroundColor: theme.palette.colors.linkBlue,
  },

  [`& .${classes.info}`]: {
    lineHeight: '19px',
    color: theme.palette.colors.darkGray,
  },
}))

interface PerformCommunityActionFormValues {
  name: string
}

export interface PerformCommunityActionProps {
  open: boolean
  communityOwnership: CommunityOwnership
  handleCommunityAction: (value: any) => void
  handleRedirection: () => void
  handleClose: () => void
  isConnectionReady?: boolean
  isCloseDisabled: boolean
  hasReceivedResponse: boolean
  revealInputValue?: boolean
  handleClickInputReveal?: () => void
  invitationCode?: InvitationPair[]
  psk?: string
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
  handleClickInputReveal,
  invitationCode,
  psk,
}) => {
  const [formSent, setFormSent] = useState(false)

  const [communityName, setCommunityName] = useState('...')
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
    control,
    clearErrors,
  } = useForm<PerformCommunityActionFormValues>({
    mode: 'onTouched',
  })

  const onSubmit = (values: PerformCommunityActionFormValues) => submitForm(handleCommunityAction, values, setFormSent)

  const submitForm = (
    handleSubmit: (value: any) => void,
    values: PerformCommunityActionFormValues,
    setFormSent: (value: boolean) => void
  ) => {
    if (communityOwnership === CommunityOwnership.Owner) {
      setFormSent(true)
      handleSubmit(parseName(values.name))
      return
    }

    if (communityOwnership === CommunityOwnership.User) {
      let data
      try {
        data = getInvitationCodes(values.name.trim())
      } catch (e) {
        console.warn(`Could not parse invitation code, reason: ${e.message}`)
      }

      if (!data) {
        setError('name', { message: InviteLinkErrors.InvalidCode })
        return
      }

      setFormSent(true)
      handleSubmit(data)
    }
  }

  const onChange = (name: string) => {
    if (communityOwnership === CommunityOwnership.User) return
    // Check community name against naming policy if user creates community
    const parsedName = parseName(name)
    setCommunityName(parsedName)
    setParsedNameDiffers(name !== parsedName)
  }

  // Lock the form if app's been open with custom protocol
  useEffect(() => {
    if (communityOwnership === CommunityOwnership.User && invitationCode?.length && psk) {
      setFormSent(true)
      setValue('name', composeInvitationShareUrl({ pairs: invitationCode, psk: psk }))
    }
  }, [communityOwnership, invitationCode])

  useEffect(() => {
    if (!open) {
      setValue('name', '')
      setCommunityName('')
      clearErrors('name')
    }
  }, [open])

  return (
    <Modal open={open} handleClose={handleClose} isCloseDisabled={isCloseDisabled}>
      <StyledModalContent container direction='column'>
        <>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container justifyContent='flex-start' direction='column' className={classes.fullContainer}>
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
                      [classes.error]: errors.name,
                    })}
                    placeholder={dictionary.placeholder}
                    errors={errors}
                    variant='outlined'
                    onchange={event => {
                      event.persist()
                      const value = event.target.value
                      onChange(value)
                      setValue('name', value)
                      // Call default
                      field.onChange(event)
                    }}
                    onblur={() => {}}
                    InputProps={
                      communityOwnership === CommunityOwnership.User ? (
                        {
                          endAdornment: (
                            <InputAdornment position='end'>
                              <IconButton size='small' onClick={handleClickInputReveal}>
                                {!revealInputValue ? (
                                  <VisibilityOff color='primary' fontSize='small' />
                                ) : (
                                  <Visibility color='primary' fontSize='small' />
                                )}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }
                      ) : (
                        <></>
                      )
                    }
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
                      data-testid={'createCommunityNameWarning'}
                    >
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
