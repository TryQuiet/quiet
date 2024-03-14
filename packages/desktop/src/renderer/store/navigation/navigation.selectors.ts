// @ts-nocheck
import { createSelector } from 'reselect'
import { MenuName } from '../../../const/MenuNames.enum'
import { StoreKeys } from '../store.keys'
import { CreatedSelectors, StoreState } from '../../sagas/store.types'

const navigationSlice: CreatedSelectors<StoreState[StoreKeys.Navigation]> = (state: StoreState) =>
  state[StoreKeys.Navigation]

export const contextMenuVisibility = (menu: MenuName): ((state: any, ...params: any[]) => boolean) =>
  createSelector(navigationSlice, reducerState => {
    return reducerState[menu]?.open as boolean
  })

export const contextMenuProps = (menu: MenuName) =>
  createSelector(navigationSlice, reducerState => {
    return reducerState[menu]?.args || {}
  })

export const navigationSelectors = {
  contextMenuVisibility,
  contextMenuProps,
}
