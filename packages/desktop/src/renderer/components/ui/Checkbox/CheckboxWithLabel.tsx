import React from 'react'
import { styled } from '@mui/material/styles';
import { withStyles } from '@mui/material/styles'
import { Field } from 'formik'
import { Checkbox, CheckboxProps as FormikCheckboxProps } from 'formik-material-ui'

import FormControlLabel from '@mui/material/FormControlLabel'
import CheckBoxOutlineBlank from '@mui/icons-material/CheckBoxOutlineBlank'
import CheckBoxIcon from '@mui/icons-material/CheckBox'

const PREFIX = 'CheckboxWithLabel';
const classes = {};

const StyledFormControlLabel
 = styled(FormControlLabel
)({});

interface CheckboxProps {
  name: string
  label: string
  labelClass: string
  rootClass: any
}

interface StyledCheckboxProps extends CheckboxProps {}

const StyledCheckbox = ((props: FormikCheckboxProps & StyledCheckboxProps) => (
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
