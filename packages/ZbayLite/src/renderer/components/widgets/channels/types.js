import Immutable from 'immutable'

// TODO: should be a component
export const MenuItem = Immutable.Record({
  title: '',
  onClick: () => console.warn('onClick event not implemented.')
}, 'MenuItem')
