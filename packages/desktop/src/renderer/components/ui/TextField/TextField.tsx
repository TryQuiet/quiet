import React from 'react'
import { DeepMap, FieldError, FieldValues, Noop } from 'react-hook-form'
import Typography from '@mui/material/Typography'
import { TextField as MuiTextField, TextFieldProps as MuiTextFieldProps } from '@mui/material'

export type TextFieldProps = MuiTextFieldProps & {
  errors: DeepMap<FieldValues, FieldError>
  classes: string
  onchange: (...event: any[]) => void
  onblur: Noop
}

export const TextField: React.FC<TextFieldProps> = ({
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
      <MuiTextField
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
