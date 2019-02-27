import React from 'react'
import PropTypes from 'prop-types'

import TextField from '@material-ui/core/TextField'
import InputAdornment from '@material-ui/core/InputAdornment'
import IconButton from '@material-ui/core/IconButton'

import Visibility from '@material-ui/icons/Visibility'
import VisibilityOff from '@material-ui/icons/VisibilityOff'

export const PasswordInput = ({
  error,
  label,
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

PasswordInput.propTypes = {
  error: PropTypes.bool,
  label: PropTypes.string.isRequired,
  password: PropTypes.string.isRequired,
  passwordVisible: PropTypes.bool.isRequired,
  handleTogglePassword: PropTypes.func.isRequired,
  handleSetPassword: PropTypes.func.isRequired
}

PasswordInput.defaultProps = {
  error: false,
  label: 'Password'
}

export default React.memo(PasswordInput)
