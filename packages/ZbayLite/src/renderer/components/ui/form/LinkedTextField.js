import React from 'react'
import PropTypes from 'prop-types'
import { Field } from 'formik'

import { formikLinkedTextField } from './helpers'

export const LinkedTextField = ({ name, label, ...props }) => {
  return (
    <Field
      name={name}
      component={formikLinkedTextField}
      label={label}
      variant='outlined'
      fullWidth
      type='number'
      {...props}
    />
  )
}

LinkedTextField.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string
}

LinkedTextField.defaultProps = {
  label: ''
}

export default React.memo(LinkedTextField)
