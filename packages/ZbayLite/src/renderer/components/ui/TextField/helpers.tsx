import React, { FunctionComponent } from 'react'
import { TextField, TextFieldProps } from 'formik-material-ui'

interface FormikLinkedTextFieldProps {
  variant: 'standard' | 'filled' | 'outlined'
  transformer: number
  otherField: string
  precise: number
  [s: string]: any
}

export const formikLinkedTextField: FunctionComponent<TextFieldProps & FormikLinkedTextFieldProps> = ({
  variant,
  transformer,
  otherField,
  precise,
  ...props
}) => {
  const decimalPlaces = precise || 4
  return (
    <TextField
      variant='outlined'
      {...props}
      inputProps={{
        onChange: (event) => {
          const value = event.currentTarget.value
          props.form.setFieldValue(props.field.name, value)
          props.form.setFieldValue(otherField, (Number(value) * transformer).toFixed(decimalPlaces))
        }
      }}
    />
  )
}
