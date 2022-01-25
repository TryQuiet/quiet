import React from 'react'

import { Field } from 'formik'
import { TextField as FormikTextField } from 'formik-material-ui'

interface TextFieldProps {
  [s: string]: any
}

export const TextField: React.FC<TextFieldProps> = ({ props }) => {
  return (
    <Field
      component={FormikTextField}
      variant='outlined'
      fullWidth
      {...props}
    />
  )
}

export default TextField
