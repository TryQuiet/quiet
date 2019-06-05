import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import TopUpModalComponent from '../../../components/widgets/walletPanel/TopUpModal'
import identitySelectors from '../../../store/selectors/identity'

const descriptions = {
  transparent: `If you are buying ZEC on a crypto exchange you most likely have to use a transparent address. After topping up your transparent balance you need to shield your ZEC in order to use them on Zbay.`,
  private: 'You can use your private address to exchange ZEC with other people.'
}

export const mapStateToProps = state => ({
  privateAddress: identitySelectors.address(state),
  transparentAddress: identitySelectors.transparentAddress(state)
})

export const TopUpModal = (props) => {
  const [type, setType] = useState('transparent')
  const address = type === 'transparent' ? props.transparentAddress : props.privateAddress
  const description = descriptions[type]
  return (
    <TopUpModalComponent
      type={type}
      address={address}
      description={description}
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

export default connect(mapStateToProps)(TopUpModal)
