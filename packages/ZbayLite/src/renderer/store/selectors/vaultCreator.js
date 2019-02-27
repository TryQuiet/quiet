import { createSelector } from 'reselect'

const store = s => s

const creator = createSelector(store, state => state.get('vaultCreator'))

const passwordVisible = createSelector(creator, v => v.passwordVisible)
const repeatVisible = createSelector(creator, v => v.repeatVisible)

const password = createSelector(creator, v => v.password)
const repeat = createSelector(creator, v => v.repeat)

export default {
  creator,
  passwordVisible,
  repeatVisible,
  password,
  repeat
}
