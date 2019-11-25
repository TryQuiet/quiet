import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import * as R from 'ramda'

import AddFunds from '../../../components/widgets/settings/AddFunds'
import identitySelectors from '../../../store/selectors/identity'

export const mapStateToProps = state => ({
  privateAddress: identitySelectors.address(state),
  transparentAddress: identitySelectors.transparentAddress(state)
})

export const TopUpModal = props => {
  const [type, setType] = useState('transparent')
  const address = type === 'transparent' ? props.transparentAddress : props.privateAddress
  return (
    <AddFunds
      type={type}
      address={address}
      handleChange={e => setType(e.target.value)}
      {...props}
    />
  )
}

TopUpModal.propTypes = {
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  handleCopy: PropTypes.func
}

export default R.compose(
  connect(mapStateToProps)
)(TopUpModal)
