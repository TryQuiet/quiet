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
    keys: {}
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
export const initialState = Immutable.Map({
  // General: _PublicChannelData({
  //   address:
  //     'ztestsapling1dfjv308amnk40s89trkvz646ne69553us0g858mmpgsw540efgftn4tf25gts2cttg3jgk9y8lx',
  //   minFee: '0',
  //   name: 'General',
  //   description: 'This is a general channel available to all users of Zbay by default.',
  //   onlyForRegistered: '0',
  //   owner: '0208be86d3cac41fdb539b0b761bedccedaa300d5a09fd3ca34b6acad1ba856bcb'
  // }),
  // Test: _PublicChannelData({
  //   address:
  //     'ztestsapling1x7wn5g6y3c9fjnv0k78ks7dfprpuk0uvqmjxye0pwnwf73yh50krkgyempp09fjdlzaxuz90wxx',
  //   minFee: '0',
  //   name: 'Test',
  //   description: '22222',
  //   onlyForRegistered: '0',
  //   owner: '0208be86d3cac41fdb539b0b761bedccedaa300d5a09fd3ca34b6acad1ba856bcb',
  //   keys: { ivk: 'zivktestsapling15seuz0zraqvkhrc9elhm4k4xvnsgmyy4tkfka8lm5j62z4hejgzq3n3xxw' }
  // })
})

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
