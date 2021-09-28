test('mock, because we keep those for the next iteration', () => {

})

// import create from '../create'
// import { initialState } from '../handlers/identity'
// import selectors from './identity'

// describe('identity selectors', () => {
//   const transparentAddress = 't14oHp2v54vfmdgQ3v3SNuQga8JKHTNi2a1'
//   const address = 'zs1z7rejlpsa98s2rrrfkwmaxu53e4ue0ulcrw0h4x5g8jl04tak0d3mm47vdtahatqrlkngh9sly'
//   const signerPrivKey = Buffer.alloc(32)
//   const signerPubKey = Buffer.alloc(32)
//   const shippingData = {
//     firstName: 'Saturn',
//     lastName: 'the Planet',
//     street: 'Coders Dv',
//     country: 'Poland',
//     region: 'Malopolska',
//     city: 'Krakow',
//     postalCode: '1337-455'
//   }
//   let store = null
//   beforeEach(() => {
//     store = create({
//       identity: {
//         ...initialState,
//         data: {
//           ...initialState.data,
//           address,
//           transparentAddress,
//           name: 'Saturn',
//           transparentBalance: '12.123456',
//           balance: '33.583004',
//           lockedBalance: '12.583004',
//           shippingData: {
//             ...initialState.data.shippingData,
//             ...shippingData
//           },
//           signerPrivKey,
//           signerPubKey,
//           donationAllow: 'false',
//           donationAddress: 'test'
//         },
//         loader: {
//           message: 'Test loading message',
//           loading: true
//         }
//       },
//       rates: {
//         zec: '1',
//         usd: '2'
//       }
//     })
//     jest.clearAllMocks()
//   })

//   it('identity', () => {
//     expect(selectors.identity(store.getState())).toMatchSnapshot()
//   })

//   it('address', () => {
//     expect(selectors.address(store.getState())).toMatchSnapshot()
//   })

//   it('data', () => {
//     expect(selectors.data(store.getState())).toMatchSnapshot()
//   })

//   it('loader', () => {
//     expect(selectors.loader(store.getState())).toMatchSnapshot()
//   })

//   it('signerPrivKey', () => {
//     expect(selectors.signerPrivKey(store.getState())).toMatchSnapshot()
//   })

//   it('signerPubKey', () => {
//     expect(selectors.signerPubKey(store.getState())).toMatchSnapshot()
//   })
// })
