import React from 'react'

import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'

import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'

interface PasswordInputProps {
  error: boolean
  label: string
  password: string
  passwordVisible: boolean
  handleTogglePassword: () => void
  handleSetPassword: () => void
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  error = false,
  label = 'Password',
  password,
  passwordVisible,
  handleTogglePassword,
  handleSetPassword
}) => (
  <TextField
    id='password'
    label={label}
    type={passwordVisible ? 'test' : 'password'}
    value={password}
    onChange={handleSetPassword}
    margin='normal'
    variant='outlined'
    InputProps={{
      endAdornment: (
        <InputAdornment position='end'>
          <IconButton
            aria-label='Toggle password visibility'
            onClick={handleTogglePassword}
            size="large">
            {passwordVisible ? <Visibility /> : <VisibilityOff />}
          </IconButton>
        </InputAdornment>
      )
    }}
    error={error}
    fullWidth
  />
)

export default PasswordInput
