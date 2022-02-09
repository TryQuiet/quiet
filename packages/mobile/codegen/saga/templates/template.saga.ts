import { sagaConst } from '../saga.const'

export const template = `
export function* {{ ${sagaConst.vars.name} }}Saga(): Generator {}
`
