import Immutable from 'immutable'
import { createAction, handleActions } from 'redux-actions'
import appSelectors from '../selectors/app'
import appHandlers from './app'
// import txnTimestampsSelector from '../selectors/txnTimestamps'
import channelsSelectors from '../selectors/channels'
import { getClient } from '../../zcash'

export const _PublicChannelData = Immutable.Record(
  {
    address: '',
    minFee: '',
    name: '',
    description: '',
    onlyForRegistered: '',
    owner: '',
    ivk: ''
  },
  'PublicChannelData'
)
// const testPublicChannelData = {
//   address: '1234',
//   minFee: '1',
//   name: '121',
//   description: 'sadadsdsadsa',
//   onlyForRegistered: 'saddsa',
//   owner: 'dsaasdasddsa'
// }
export const initialState = Immutable.Map()

export const setPublicChannels = createAction('SET_PUBLIC_CHANNELS')

export const actions = {
  setPublicChannels
}
export const fetchPublicChannels = () => async (dispatch, getState) => {
  try {
    const publicChannels = channelsSelectors.publicChannels(getState())
    const transfers = await getClient().payment.received(publicChannels.get('address'))
    // let txnTimestamps = txnTimestampsSelector.tnxTimestamps(getState())
    // const testChannel = _PublicChannelData(testPublicChannelData)
    // await dispatch(setPublicChannels({ publicChannels: { [i]: testChannel } }))
    if (
      transfers.length === appSelectors.transfers(getState()).get(publicChannels.get('address'))
    ) {
      return
    } else {
      dispatch(
        appHandlers.actions.setTransfers({
          id: publicChannels.get('address'),
          value: transfers.length
        })
      )
    }
  } catch (err) {
    console.warn(err)
  }
}

export const epics = {
  fetchPublicChannels
}

export const reducer = handleActions(
  {
    [setPublicChannels]: (state, { payload: { publicChannels } }) => {
      return state.merge(publicChannels)
    }
  },
  initialState
)

export default {
  reducer,
  epics,
  actions
}
