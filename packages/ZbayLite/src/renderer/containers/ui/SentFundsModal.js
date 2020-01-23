import React, { useEffect, useState } from 'react'
import * as R from 'ramda'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { DateTime } from 'luxon'

import Binance from 'binance-api-node'

import { withModal } from '../../store/handlers/modals'
import { rate } from '../../store/selectors/rates'
import modalSelectors from '../../store/selectors/modals'
import SentFundsModalComponent from '../../components/ui/SentFundsModal'

export const client = Binance()

export const mapStateToProps = state => ({
  rateUsd: rate('usd')(state),
  payload: modalSelectors.payload('sentFunds')(state)
})

export const SentFundsModal = ({
  payload = {},
  open,
  handleClose,
  rateUsd
}) => {
  const [historicPrice, setHistoricPrice] = useState(rateUsd.toNumber())
  useEffect(() => {
    if (payload.txid) {
      try {
        const pulldata = async () => {
          const date = await client.candles({
            symbol: 'ZECUSDT',
            interval: '1m',
            limit: 1,
            startTime: payload.timestamp * 1000,
            endTime: DateTime.utc().toSeconds() * 1000
          })
          setHistoricPrice(parseFloat(date[0].open))
        }
        pulldata()
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
  connect(mapStateToProps, null),
  withModal('sentFunds'),
  withRouter,
  React.memo
)(SentFundsModal)
