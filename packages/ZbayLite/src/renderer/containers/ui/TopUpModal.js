import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import * as R from 'ramda'

import TopUpModalComponent from '../../components/ui/TopUpModal/TopUpModal'
import identitySelectors from '../../store/selectors/identity'
import { withModal } from '../../store/handlers/modals'

export const mapStateToProps = state => ({
  privateAddress: identitySelectors.address(state),
  transparentAddress: identitySelectors.transparentAddress(state)
})

export const TopUpModal = props => {
  const [type, setType] = useState('transparent')
  const address = type === 'transparent' ? props.transparentAddress : props.privateAddress
  return (
    <TopUpModalComponent
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
  connect(mapStateToProps),
  withModal('topUp')
)(TopUpModal)
