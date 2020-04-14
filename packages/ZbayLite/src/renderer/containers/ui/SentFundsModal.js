import React, { useEffect, useState } from 'react'
import * as R from 'ramda'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import Binance from 'binance-api-node'

import { withModal } from '../../store/handlers/modals'
import { rate } from '../../store/selectors/rates'
import rateHandlers from '../../store/handlers/rates'
import modalSelectors from '../../store/selectors/modals'
import SentFundsModalComponent from '../../components/ui/SentFundsModal'

export const client = Binance()

export const mapStateToProps = state => ({
  rateUsd: rate('usd')(state),
  payload: modalSelectors.payload('sentFunds')(state)
})
export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      fetchPriceForTime: rateHandlers.epics.fetchPriceForTime
    },
    dispatch
  )

export const SentFundsModal = ({
  payload = {},
  open,
  handleClose,
  rateUsd,
  fetchPriceForTime
}) => {
  const [historicPrice, setHistoricPrice] = useState(rateUsd.toNumber())
  useEffect(() => {
    if (payload.txid) {
      try {
        const pullPrice = async () => {
          const price = await fetchPriceForTime(parseInt(payload.timestamp))
          setHistoricPrice(price)
        }
        pullPrice()
      } catch (err) {
        console.warn(err)
      }
    }
  }, [payload])
  if (payload.feeZec) {
    return (
      <SentFundsModalComponent
        {...payload}
        open={open}
        handleClose={handleClose}
      />
    )
  } else {
    return (
      <SentFundsModalComponent
        {...payload}
        valueWhenSent={payload.amountZec * historicPrice}
        amountUsd={payload.amountZec * rateUsd.toNumber()}
        open={open}
        handleClose={handleClose}
      />
    )
  }
}
export default R.compose(
  connect(mapStateToProps, mapDispatchToProps),
  withModal('sentFunds'),
  withRouter,
  React.memo
)(SentFundsModal)
