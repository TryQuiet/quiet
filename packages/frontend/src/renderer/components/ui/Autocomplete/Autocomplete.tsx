import React from 'react'
import { Field } from 'formik'
import Autocomplete, { AutocompleteProps } from '@material-ui/lab/Autocomplete'

interface AutocompleteFieldsProps {
  name: string
}

export const AutocompleteField: React.FC<AutocompleteProps & AutocompleteFieldsProps> = ({
  name,
  ...props
}) => {
  return <Field component={Autocomplete} fullWidth {...props} />
}

export default AutocompleteField
