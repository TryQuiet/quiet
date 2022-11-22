import React from 'react'
import { withStyles } from '@mui/material/styles'
import { Field } from 'formik'
import { Checkbox, CheckboxProps as FormikCheckboxProps } from 'formik-material-ui'

import FormControlLabel from '@mui/material/FormControlLabel'
import CheckBoxOutlineBlank from '@mui/icons-material/CheckBoxOutlineBlank'
import CheckBoxIcon from '@mui/icons-material/CheckBox'

interface CheckboxProps {
  name: string
  label: string
  labelClass: string
  rootClass: any
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
  rootClass
}) => (
  <FormControlLabel
    label={label}
    classes={{ root: rootClass, label: labelClass }}
    control={<Field name={name} component={StyledCheckbox} color={'primary'} />}
  />
)

export default CheckboxWithLabel
