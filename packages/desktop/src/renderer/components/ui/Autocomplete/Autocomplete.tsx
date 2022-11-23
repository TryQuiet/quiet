import React from 'react'
import { Field } from 'formik'
import Autocomplete, { AutocompleteProps } from '@mui/material/Autocomplete'

interface AutocompleteFieldsProps {
  name: string
}

// @ts-ignore
export const AutocompleteField: React.FC<AutocompleteProps & AutocompleteFieldsProps> = ({
  name,
  ...props
}) => {
  return <Field component={Autocomplete} fullWidth {...props} />
}

export default AutocompleteField
