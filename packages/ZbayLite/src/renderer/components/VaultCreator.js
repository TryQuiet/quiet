import React from 'react'
import classNames from 'classnames'
import PropTypes from 'prop-types'

import Button from '@material-ui/core/Button'
import FormControl from '@material-ui/core/FormControl'
import { withStyles } from '@material-ui/core/styles'

import PasswordInput from './ui/PasswordInput'

const styles = theme => ({
  submit: {
    'min-height': '56px',
    'margin-bottom': theme.spacing.unit,
    'margin-top': 2 * theme.spacing.unit
  }
})

export const VaultCreator = ({
  classes,
  styles,
  password,
  repeat,
  passwordVisible,
  repeatVisible,
  onSend,
  handleTogglePassword,
  handleToggleRepeat,
  handleSetPassword,
  handleSetRepeat
}) => {
  const notMatching = (password !== '' && repeat !== '' && password !== repeat)
  return (
    <div className={classNames({ [styles.wrapper]: styles.wrapper })}>
      <FormControl required>
        <PasswordInput
          label='Password'
          passwordVisible={passwordVisible}
          password={password}
          handleSetPassword={handleSetPassword}
          handleTogglePassword={handleTogglePassword}
        />
        <PasswordInput
          label='Repeat password'
          passwordVisible={repeatVisible}
          password={repeat}
          handleSetPassword={handleSetRepeat}
          handleTogglePassword={handleToggleRepeat}
          error={notMatching}
        />
        <Button
          variant='contained'
          size='large'
          color='primary'
          className={
            classNames({
              [classes.submit]: true,
              [styles.button]: styles.button
            })
          }
          margin='normal'
          disabled={password === '' || repeat === '' || repeat !== password}
          onClick={onSend}
          fullWidth
        >
          Submit
        </Button>
      </FormControl>
    </div>
  )
}

VaultCreator.propTypes = {
  classes: PropTypes.object.isRequired,
  styles: PropTypes.exact({
    wrapper: PropTypes.string,
    button: PropTypes.string
  }),
  password: PropTypes.string.isRequired,
  repeat: PropTypes.string.isRequired,
  passwordVisible: PropTypes.bool.isRequired,
  repeatVisible: PropTypes.bool.isRequired,
  onSend: PropTypes.func.isRequired,
  handleTogglePassword: PropTypes.func.isRequired,
  handleToggleRepeat: PropTypes.func.isRequired,
  handleSetPassword: PropTypes.func.isRequired,
  handleSetRepeat: PropTypes.func.isRequired
}

VaultCreator.defaultProps = {
  passwordVisible: false,
  repeatVisible: false,
  styles: {
    wrapper: '',
    button: ''
  }
}

export default React.memo(withStyles(styles)(VaultCreator))
