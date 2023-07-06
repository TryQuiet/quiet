import React from 'react'
import { DeepMap, FieldError, FieldValues, Noop } from 'react-hook-form'
import Typography from '@mui/material/Typography'
import TextField, { TextFieldProps } from '@mui/material/TextField'

export type TextInputProps = TextFieldProps & {
  errors: DeepMap<FieldValues, FieldError>
  classes: string
  onchange: (...event: any[]) => void
  onblur: Noop
}

export const TextInput: React.FC<TextInputProps> = ({
  errors,
  defaultValue,
  classes,
  onchange,
  onblur,
  name = '',
  ...props
}) => {
  const hasError = Boolean(errors?.[name])

  return (
    <>
      <TextField
        error={hasError}
        defaultValue={defaultValue}
        name={name}
        className={classes}
        variant={'outlined'}
        onChange={onchange}
        onBlur={onblur}
        {...props}
      />

      <Typography variant='body2' color='error'>
        {errors?.[name]?.message || ''}
      </Typography>
    </>
  )
}
