import React from 'react'
import { DeepMap, FieldError, FieldValues, Noop } from 'react-hook-form'
import Typography from '@mui/material/Typography'
import { styled } from '@mui/material/styles'
import { TextField as MuiTextField, TextFieldProps as MuiTextFieldProps } from '@mui/material'

/**
 * The design library's form field.
 *
 * The box is "Input 2.0 base" as the create-channel panel instantiates it (Figma
 * PVQ1Kjf6Cq8ng1czuVtvR8, "Create channel" 5055:16131): 48 tall, radius 16, 16 of padding, inside a
 * #B3B3B3 hairline. Input 2.0 defines no focus, error or disabled state, so those come from its
 * successor Input3.0 (design library 0j7Nna9zWmfOSNmRmQK1Uh 5077:43258), which is the library's
 * current statement on them: #1B6FEC while focused, #D13135 in error, and #F0F0F0 inside #E5E5E5
 * when disabled.
 *
 * Pass `title` to get the field's own label above the box, at 14/20 in #4C4C4C with 8 between the
 * two. Fields that do not ask for one keep the markup they had.
 */
export const FIELD_HEIGHT = 48
export const FIELD_RADIUS = 16
export const FIELD_INSET = 16
export const FIELD_LABEL_GAP = 8

const PREFIX = 'TextField'

const classes = {
  root: `${PREFIX}root`,
  label: `${PREFIX}label`,
}

/** The label column; only a field given a `title` is wrapped in one. */
const StyledField = styled('div')(({ theme }) => ({
  [`&.${classes.root}`]: {
    display: 'flex',
    flexDirection: 'column',
    gap: FIELD_LABEL_GAP,
    width: '100%',
  },

  [`& .${classes.label}`]: {
    fontSize: 14,
    lineHeight: '20px',
    color: theme.palette.colors.gray70,
  },
}))

/** The box itself, so every field in the app picks the design up, labelled or not. */
const StyledTextField = styled(MuiTextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    height: FIELD_HEIGHT,
    borderRadius: FIELD_RADIUS,
    backgroundColor: theme.palette.background.default,

    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.colors.border02,
      borderWidth: 1,
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.colors.border02,
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.colors.linkBlue,
      borderWidth: 1,
    },
    '&.Mui-error .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.error.main,
    },
    '&.Mui-disabled': {
      backgroundColor: theme.palette.colors.border01,
    },
    '&.Mui-disabled .MuiOutlinedInput-notchedOutline': {
      borderColor: '#E5E5E5',
    },
  },

  '& .MuiOutlinedInput-input': {
    padding: `0 ${FIELD_INSET}px`,
    fontSize: 14,
    lineHeight: '20px',
    '&::placeholder': {
      color: theme.palette.colors.gray50,
      opacity: 1,
    },
  },
}))

export type TextFieldProps = MuiTextFieldProps & {
  errors: DeepMap<FieldValues, FieldError>
  classes: string
  onchange: (...event: any[]) => void
  onblur: Noop
  /** The label the design draws above the box; supply it here rather than beside the field. */
  title?: string
}

export const TextField: React.FC<TextFieldProps> = ({
  errors,
  defaultValue,
  classes: className,
  onchange,
  onblur,
  name = '',
  title,
  ...props
}) => {
  const hasError = Boolean(errors?.[name])

  const field = (
    <>
      <StyledTextField
        error={hasError}
        defaultValue={defaultValue}
        name={name}
        className={className}
        variant={'outlined'}
        onChange={onchange}
        onBlur={onblur}
        {...props}
      />

      {hasError && (
        // Rendered only when there is something to say: an always-present empty line would add a
        // second gap under every field, which the design does not have.
        <Typography variant='body2' color='error'>
          {errors?.[name]?.message}
        </Typography>
      )}
    </>
  )

  if (!title) return field

  return (
    <StyledField className={classes.root}>
      <Typography className={classes.label} data-testid={`${name}-field-label`}>
        {title}
      </Typography>
      {field}
    </StyledField>
  )
}
