import React from 'react'
import PropTypes from 'prop-types'
import { Field } from 'formik'
import { Select as FormikSelectField } from 'formik-material-ui'

import OutlinedInput from '@material-ui/core/OutlinedInput'

export const SelectField = ({ children, name, id, ...props }) => (
  <Field
    component={FormikSelectField}
    input={
      <OutlinedInput
        name={name}
        id={id}
        labelWidth={100}
      />
    }
    name={name}
    id={id}
    {...props}
  >
    {children}
  </Field>
)

SelectField.propTypes = {
  name: PropTypes.string.isRequired
}

export default SelectField
