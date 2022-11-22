import React, { useState } from 'react'
import { Field } from 'formik'
import { TextField as FormikTextField } from 'formik-material-ui'

import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'

import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'

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
