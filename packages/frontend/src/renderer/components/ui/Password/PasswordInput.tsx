import React from 'react'

import TextField from '@material-ui/core/TextField'
import InputAdornment from '@material-ui/core/InputAdornment'
import IconButton from '@material-ui/core/IconButton'

import Visibility from '@material-ui/icons/Visibility'
import VisibilityOff from '@material-ui/icons/VisibilityOff'

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
          >
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
