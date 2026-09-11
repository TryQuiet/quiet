import React, { useEffect, useState } from 'react'
import { styled } from '@mui/material/styles'
import classNames from 'classnames'
import { Controller, useForm } from 'react-hook-form'
import Typography from '@mui/material/Typography'
import WarningIcon from '@mui/icons-material/Warning'

import { parseName } from '@quiet/common'

import { TextField } from '../ui/TextField/TextField'
import { LoadingButton } from '../ui/LoadingButton/LoadingButton'
import { communityNameField } from '../../forms/fields/communityFields'
import { OnboardingBody } from './OnboardingBody'

const PREFIX = 'CreateCommunityComponent'

const classes = {
  focus: `${PREFIX}focus`,
  margin: `${PREFIX}margin`,
  error: `${PREFIX}error`,
  label: `${PREFIX}label`,
  button: `${PREFIX}button`,
  warning: `${PREFIX}warning`,
  warningIcon: `${PREFIX}warningIcon`,
}

const Form = styled('form')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.space.xl,
  [`& .${classes.label}`]: {
    color: theme.palette.colors.gray70,
    marginBottom: theme.space.xs,
  },
  [`& .${classes.focus}`]: {
    '& .MuiOutlinedInput-root': {
      '&.Mui-focused fieldset': {
        borderColor: theme.palette.colors.linkBlue,
      },
    },
  },
  [`& .${classes.margin}`]: {
    '& .MuiFormHelperText-contained': {
      margin: `${theme.space.xs}px 0px`,
    },
  },
  [`& .${classes.error}`]: {
    '& .MuiOutlinedInput-root': {
      '&.Mui-focused fieldset': {
        borderColor: theme.palette.colors.red,
      },
    },
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
  [`& .${classes.warning}`]: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.space.sm,
  },
  [`& .${classes.warningIcon}`]: {
    color: theme.palette.warning.main,
  },
}))

interface CreateCommunityFormValues {
  name: string
}

export interface CreateCommunityComponentProps {
  open?: boolean
  isConnectionReady?: boolean
  handleCommunityAction: (name: string) => void
}

const field = communityNameField()

/**
 * Create a community · Figma 2811:2451, without the icon upload (phase 2):
 * heading, the "Add a name for your community" field, Continue. The parsed
 * name warning is the shipping behaviour, kept.
 */
export const CreateCommunityComponent: React.FC<CreateCommunityComponentProps> = ({
  open = true,
  isConnectionReady = true,
  handleCommunityAction,
}) => {
  const [communityName, setCommunityName] = useState('')
  const [parsedNameDiffers, setParsedNameDiffers] = useState(false)

  const {
    handleSubmit,
    formState: { errors },
    setValue,
    control,
    clearErrors,
  } = useForm<CreateCommunityFormValues>({ mode: 'onTouched' })

  const onSubmit = (values: CreateCommunityFormValues) => {
    handleCommunityAction(parseName(values.name))
  }

  const onChange = (name: string) => {
    const parsedName = parseName(name)
    setCommunityName(parsedName)
    setParsedNameDiffers(name !== parsedName)
  }

  useEffect(() => {
    if (!open) {
      setValue('name', '')
      setCommunityName('')
      clearErrors('name')
    }
  }, [open])

  return (
    <OnboardingBody heading={'Create a community'} dataTestId='create-community'>
      <Form onSubmit={handleSubmit(onSubmit)}>
        <div>
          <Typography variant='body2' className={classes.label} component='label' htmlFor='community-name'>
            Add a name for your community
          </Typography>
          <Controller
            control={control}
            defaultValue={''}
            rules={field.validation}
            name={'name'}
            render={({ field: controller }) => (
              <TextField
                {...field.fieldProps}
                id='community-name'
                fullWidth
                classes={classNames({
                  [classes.focus]: true,
                  [classes.margin]: true,
                  [classes.error]: errors.name,
                })}
                placeholder={'Community name'}
                errors={errors}
                variant='outlined'
                onchange={event => {
                  event.persist()
                  const value = event.target.value
                  onChange(value)
                  setValue('name', value)
                  controller.onChange(event)
                }}
                onblur={() => {}}
                value={controller.value}
                autoFocus
              />
            )}
          />
        </div>
        {!errors.name && communityName.length > 0 && parsedNameDiffers ? (
          <div className={classes.warning}>
            <WarningIcon className={classes.warningIcon} />
            <Typography variant='body2' data-testid={'createCommunityNameWarning'}>
              Your community will be created as <b>{`#${communityName}`}</b>
            </Typography>
          </div>
        ) : null}
        <LoadingButton
          type='submit'
          variant='contained'
          size='small'
          color='primary'
          text={'Continue'}
          data-testid={'continue-createCommunity'}
          classes={{ button: classes.button }}
          disabled={!isConnectionReady}
        />
      </Form>
    </OnboardingBody>
  )
}

export default CreateCommunityComponent
