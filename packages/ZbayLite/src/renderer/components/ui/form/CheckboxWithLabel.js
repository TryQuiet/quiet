import React from 'react'
import PropTypes from 'prop-types'
import { Field } from 'formik'
import { Checkbox } from 'formik-material-ui'
import FormControlLabel from '@material-ui/core/FormControlLabel'

export const CheckboxWithLabel = ({ name, label, labelClass, ...props }) => (
  <FormControlLabel
    control={<Field name={name} component={Checkbox} {...props} />}
    label={label}
    classes={{ label: labelClass }}
    {...props}
  />
)

CheckboxWithLabel.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string,
  labelClass: PropTypes.string
}

CheckboxWithLabel.defaultProps = {
  label: ''
}

export default React.memo(CheckboxWithLabel)
