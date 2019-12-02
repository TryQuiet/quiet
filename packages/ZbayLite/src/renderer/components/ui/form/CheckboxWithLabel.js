import React from 'react'
import PropTypes from 'prop-types'
import { withStyles } from '@material-ui/core/styles'
import { Field } from 'formik'
import { Checkbox } from 'formik-material-ui'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import CheckBoxOutlineBlank from '@material-ui/icons/CheckBoxOutlineBlank'
import CheckBoxIcon from '@material-ui/icons/CheckBox'

const styles = theme => ({
  root: {
  }
})

const StyledCheckbox = withStyles(styles)((props) => <Checkbox {...props}
  checkedIcon={<CheckBoxIcon style={{ fontSize: '18px' }} />}
  icon={<CheckBoxOutlineBlank style={{ fontSize: '18px' }} />} />)

export const CheckboxWithLabel = ({ name, label, labelClass, rootClass, ...props }) => (
  <FormControlLabel
    control={<Field name={name} component={StyledCheckbox} {...props} />}
    label={label}
    classes={{ root: rootClass, label: labelClass }}
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
