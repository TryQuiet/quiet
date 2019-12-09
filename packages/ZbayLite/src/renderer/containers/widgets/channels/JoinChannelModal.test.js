/* eslint import/first: 0 */
import Immutable from 'immutable'

import { mapStateToProps, mapDispatchToProps } from './JoinChannelModal'

import create from '../../../store/create'
import { _PublicChannelData } from '../../../store/handlers/publicChannels'

describe('JoinChannelModal', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      initialState: Immutable.Map({
        importedChannel: Immutable.Map({
          General: _PublicChannelData({
            address:
              'ztestsapling1dfjv308amnk40s89trkvz646ne69553us0g858mmpgsw540efgftn4tf25gts2cttg3jgk9y8lx',
            minFee: '0',
            name: 'General',
            description: 'This is a general channel available to all users of Zbay by default.',
            onlyForRegistered: '0',
            owner: '0208be86d3cac41fdb539b0b761bedccedaa300d5a09fd3ca34b6acad1ba856bcb'
          }),
          Test: _PublicChannelData({
            address:
              'ztestsapling1x7wn5g6y3c9fjnv0k78ks7dfprpuk0uvqmjxye0pwnwf73yh50krkgyempp09fjdlzaxuz90wxx',
            minFee: '0',
            name: 'Test',
            description: '22222',
            onlyForRegistered: '0',
            owner: '0208be86d3cac41fdb539b0b761bedccedaa300d5a09fd3ca34b6acad1ba856bcb',
            keys: {
              ivk: 'zivktestsapling15seuz0zraqvkhrc9elhm4k4xvnsgmyy4tkfka8lm5j62z4hejgzq3n3xxw'
            }
          })
        })
      })
    })
  })

  it('will receive right props', () => {
    const props = mapStateToProps(store.getState())
    expect(props).toMatchSnapshot()
  })

  it('will receive right actions', () => {
    const actions = mapDispatchToProps(x => x)
    expect(actions).toMatchSnapshot()
  })
})
