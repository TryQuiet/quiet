import React from 'react'
import PropTypes from 'prop-types'
import { Field } from 'formik'
import Autocomplete from '@material-ui/lab/Autocomplete'

export const AutocompleteField = (props) => {
  return (
    <Field
      component={Autocomplete}
      fullWidth
      {...props}
    />
  )
}

AutocompleteField.propTypes = {
  name: PropTypes.string.isRequired
}

export default AutocompleteField
