import React from 'react'
import PropTypes from 'prop-types'
import { Field } from 'formik'
import { Checkbox } from 'formik-material-ui'
import FormControlLabel from '@material-ui/core/FormControlLabel'

export const CheckboxWithLabel = ({ name, label, ...props }) => (
  <FormControlLabel
    control={
      <Field name={name} component={Checkbox} fullWidth {...props} />
    }
    label={label}
  />
)

CheckboxWithLabel.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string
}

CheckboxWithLabel.defaultProps = {
  label: ''
}

export default React.memo(CheckboxWithLabel)
