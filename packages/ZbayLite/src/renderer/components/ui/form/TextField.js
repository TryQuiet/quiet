import React from 'react'
import PropTypes from 'prop-types'
import { Field } from 'formik'
import { TextField as FormikTextField } from 'formik-material-ui'

export const TextField = ({ name, label, ...props }) => (
  <Field
    name={name}
    component={FormikTextField}
    label={label}
    variant='outlined'
    fullWidth
    {...props}
  />
)

TextField.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string
}

TextField.defaultProps = {
  label: ''
}

export default React.memo(TextField)
