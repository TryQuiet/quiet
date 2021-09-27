import React from 'react'
import { withStyles } from '@material-ui/core/styles'
import { Field } from 'formik'
import { Checkbox, CheckboxProps as FormikCheckboxProps } from 'formik-material-ui'

import FormControlLabel from '@material-ui/core/FormControlLabel'
import CheckBoxOutlineBlank from '@material-ui/icons/CheckBoxOutlineBlank'
import CheckBoxIcon from '@material-ui/icons/CheckBox'

interface CheckboxProps {
  name: string
  label: string
  labelClass: string
  rootClass: any
  [s: string]: any
}

interface StyledCheckboxProps extends CheckboxProps {}

const StyledCheckbox = withStyles({})((props: FormikCheckboxProps & StyledCheckboxProps) => (
  <Checkbox
    {...props}
    checkedIcon={<CheckBoxIcon style={{ fontSize: '18px' }} />}
    icon={<CheckBoxOutlineBlank style={{ fontSize: '18px' }} />}
  />
))

export const CheckboxWithLabel: React.FC<CheckboxProps> = ({
  name,
  label,
  labelClass,
  rootClass,
  ...props
}) => (
  <FormControlLabel
    control={<Field name={name} component={StyledCheckbox} {...props} />}
    label={label}
    classes={{ root: rootClass, label: labelClass }}
    {...props}
  />
)

export default CheckboxWithLabel
