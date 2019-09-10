import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { lifecycle } from 'recompose'
import * as R from 'ramda'

import WalletPanelComponent from '../../../components/widgets/walletPanel/WalletPanel'
import identityHandlers from '../../../store/handlers/identity'
import usersHandlers from '../../../store/handlers/users'
import { useInterval } from '../../hooks'

export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      getBalance: identityHandlers.epics.fetchBalance,
      fetchUsers: usersHandlers.epics.fetchUsers
    },
    dispatch
  )

export const WalletPanel = ({ className, fetchUsers, getBalance }) => {
  useInterval(getBalance, 15000)
  useInterval(fetchUsers, 15000)
  const [topUpOpen, setTopUpOpen] = useState(false)
  return (
    <WalletPanelComponent
      handleReceive={() => setTopUpOpen(true)}
      handleCloseTopUp={() => setTopUpOpen(false)}
      topUpOpen={topUpOpen}
    />
  )
}

WalletPanel.propTypes = {
  getBalance: PropTypes.func.isRequired
}

export default R.compose(
  connect(
    null,
    mapDispatchToProps
  ),
  lifecycle({
    async componentDidMount () {
      await this.props.getBalance()
      await this.props.fetchUsers()
    }
  })
)(WalletPanel)
