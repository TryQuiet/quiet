import React, { useState } from 'react'
import classNames from 'classnames'

import Typography from '@material-ui/core/Typography'
import Grid from '@material-ui/core/Grid'
import { makeStyles } from '@material-ui/core/styles'

import WarningIcon from '@material-ui/icons/Warning'

import Modal from '../ui/Modal/Modal'
import { LoadingButton } from '../ui/LoadingButton/LoadingButton'

import { CommunityAction } from '../CreateJoinCommunity/community.keys'
import {
  CreateCommunityDictionary,
  JoinCommunityDictionary
} from '../CreateJoinCommunity/community.dictionary'
import { TextInput } from '../../forms/components/textInput'
import { Controller, useForm } from 'react-hook-form'
import { parseName } from '../../../utils/functions/naming'

const useStyles = makeStyles(theme => ({
  focus: {
    '& .MuiOutlinedInput-root': {
      '&.Mui-focused fieldset': {
        borderColor: theme.palette.colors.linkBlue
      }
    }
  },
  margin: {
    '& .MuiFormHelperText-contained': {
      margin: '5px 0px'
    }
  },
  error: {
    '& .MuiOutlinedInput-root': {
      '&.Mui-focused fieldset': {
        borderColor: theme.palette.colors.red
      }
    }
  },
  main: {
    backgroundColor: theme.palette.colors.white,
    padding: '0px 32px'
  },
  fullContainer: {
    width: '100%'
  },
  gutter: {
    marginTop: 8,
    marginBottom: 24
  },
  button: {
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
  title: {
    marginBottom: 24
  },
  iconDiv: {
    width: 24,
    height: 28,
    marginRight: 8
  },
  warrningIcon: {
    color: '#FFCC00'
  },
  warrningMessage: {
    wordBreak: 'break-word'
  },
  rootBar: {
    width: 350,
    marginTop: 32,
    marginBottom: 16
  },
  progressBar: {
    backgroundColor: theme.palette.colors.linkBlue
  },
  info: {
    lineHeight: '19px',
    color: theme.palette.colors.darkGray
  }
}))

interface PerformCommunityActionFormValues {
  name: string
}

export interface PerformCommunityActionProps {
  open: boolean
  communityAction: CommunityAction
  handleCommunityAction: (value: string) => void
  handleRedirection: () => void
  handleClose: () => void
  isConnectionReady?: boolean
  community: boolean
}

export const PerformCommunityActionComponent: React.FC<PerformCommunityActionProps> = ({
  open,
  communityAction,
  handleCommunityAction,
  handleRedirection,
  handleClose,
  isConnectionReady = true,
  community
}) => {
  const classes = useStyles({})

  const [communityName, setCommunityName] = useState('')
  const [parsedNameDiffers, setParsedNameDiffers] = useState(false)

  const dictionary =
    communityAction === CommunityAction.Create
      ? CreateCommunityDictionary(handleRedirection)
      : JoinCommunityDictionary(handleRedirection)

  const {
    handleSubmit,
    formState: { errors },
    setValue,
    control
  } = useForm<PerformCommunityActionFormValues>({
    mode: 'onTouched'
  })

  const onSubmit = (values: PerformCommunityActionFormValues) =>
    submitForm(handleCommunityAction, values)

  const submitForm = (
    handleSubmit: (value: string) => void,
    values: PerformCommunityActionFormValues
  ) => {
    const submitValue =
      communityAction === CommunityAction.Create ? parseName(values.name) : values.name.trim()
    handleSubmit(submitValue)
  }

  const onChange = (name: string) => {
    if (communityAction === CommunityAction.Join) return
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
    <Modal open={open} handleClose={handleClose} isCloseDisabled={!community}>
      <Grid container className={classes.main} direction='column'>
        <>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid
              container
              justify='flex-start'
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
                    onblur={() => {
                      field.onBlur()
                    }}
                    value={communityAction === CommunityAction.Join ? field.value.trim() : field.value}
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
              classes={{ button: classes.button }}
              disabled={!isConnectionReady}
            />
          </form>
        </>
      </Grid>
    </Modal>
  )
}

export default PerformCommunityActionComponent
