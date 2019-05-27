import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { Field } from 'formik'
import { TextField as FormikTextField } from 'formik-material-ui'
import * as R from 'ramda'

import InputAdornment from '@material-ui/core/InputAdornment'
import IconButton from '@material-ui/core/IconButton'
import { withStyles } from '@material-ui/core/styles'

import Visibility from '@material-ui/icons/Visibility'
import VisibilityOff from '@material-ui/icons/VisibilityOff'

const styles = {
  borderBox: {
    boxSizing: 'border-box'
  }
}

export const PasswordField = ({ classes, name, label, ...props }) => {
  const [visible, setVisible] = useState(false)
  return (
    <Field
      name={name}
      component={FormikTextField}
      type={visible ? 'text' : 'password'}
      label={label}
      variant='outlined'
      InputProps={{
        // TODO: Should be removed after migrating to material v4.0
        className: classes.borderBox,
        endAdornment: (
          <InputAdornment position='end' style={{ padding: 0 }}>
            <IconButton
              aria-label='Toggle password visibility'
              onClick={() => setVisible(!visible)}
            >
              {visible ? <Visibility /> : <VisibilityOff />}
            </IconButton>
          </InputAdornment>
        )
      }}
      {...props}
    />
  )
}

PasswordField.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string
}

PasswordField.defaultProps = {
  label: ''
}

export default R.compose(
  React.memo,
  withStyles(styles)
)(PasswordField)
