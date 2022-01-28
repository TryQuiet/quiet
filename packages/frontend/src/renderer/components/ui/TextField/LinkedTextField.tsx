import React from 'react'

import { Field } from 'formik'
import { formikLinkedTextField } from './helpers'

interface LinkedTextFieldProps {
  name: string
  label?: string
  [s: string]: any
}

export const LinkedTextField: React.FC<LinkedTextFieldProps> = ({ name, label = '', ...props }) => {
  return (
    <Field
      name={name}
      component={formikLinkedTextField}
      label={label}
      variant='outlined'
      type='number'
      fullWidth
      {...props}
    />
  )
}

export default LinkedTextField
