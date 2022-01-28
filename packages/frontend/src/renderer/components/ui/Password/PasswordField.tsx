import React, { useState } from 'react'
import { Field } from 'formik'
import { TextField as FormikTextField } from 'formik-material-ui'

import InputAdornment from '@material-ui/core/InputAdornment'
import IconButton from '@material-ui/core/IconButton'

import Visibility from '@material-ui/icons/Visibility'
import VisibilityOff from '@material-ui/icons/VisibilityOff'

interface PasswordFieldProps {
  name: string
  label?: string
  [s: string]: any
}

export const PasswordField: React.FC<PasswordFieldProps> = ({ name, label = '', ...props }) => {
  const [visible, setVisible] = useState(false)
  return (
    <Field
      name={name}
      component={FormikTextField}
      type={visible ? 'text' : 'password'}
      label={label}
      variant='outlined'
      InputProps={{
        endAdornment: (
          <InputAdornment position='end' style={{ padding: 0 }}>
            <IconButton
              aria-label='Toggle password visibility'
              onClick={() => setVisible(!visible)}
              tabIndex={-1}>
              {visible ? <Visibility /> : <VisibilityOff />}
            </IconButton>
          </InputAdornment>
        )
      }}
      {...props}
    />
  )
}

export default PasswordField
