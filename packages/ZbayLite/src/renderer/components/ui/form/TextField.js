import React from 'react'
import PropTypes from 'prop-types'
import { Field } from 'formik'
import { TextField as FormikTextField } from 'formik-material-ui'

export const TextField = (props) => (
  <Field
    component={FormikTextField}
    {...props}
  />
)

TextField.propTypes = {
  name: PropTypes.string.isRequired
}

export default TextField
