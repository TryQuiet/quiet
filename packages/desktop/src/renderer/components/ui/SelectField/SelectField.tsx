import React, { ReactElement } from 'react'

import { Field } from 'formik'
import { Select as FormikSelectField } from 'formik-material-ui'

import OutlinedInput from '@mui/material/OutlinedInput'

interface SelectFieldProps {
  name: string
  id?: string
  children?: ReactElement
  [s: string]: any
}

export const SelectField: React.FC<SelectFieldProps> = ({ name, id, children, ...props }) => (
  <Field
    component={FormikSelectField}
    input={<OutlinedInput name={name} id={id} label='Select' />}
    name={name}
    id={id}
    {...props}>
    {children}
  </Field>
)

export default SelectField
