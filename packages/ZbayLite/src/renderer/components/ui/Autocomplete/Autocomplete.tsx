import React from 'react'
import { Field } from 'formik'
import Autocomplete from '@material-ui/lab/Autocomplete'

interface AutocompleteFieldsProps {
  name: string
  [index: string]: any
}

export const AutocompleteField: React.FC<AutocompleteFieldsProps> = ({ name, ...props }) => {
  return <Field component={Autocomplete} fullWidth {...props} />
}

export default AutocompleteField
