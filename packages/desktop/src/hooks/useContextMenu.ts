import { useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { MenuName } from '../const/MenuNames.enum'
import { navigationSelectors } from '../renderer/store/navigation/navigation.selectors'
import { navigationActions, OpenMenuPayload } from '../renderer/store/navigation/navigation.slice'

export class UseContextMenuTypeWrapper<T> {
  types(e: MenuName) {
    // eslint-disable-next-line
    return useContextMenu<T>(e)
  }
}

export const useContextMenu = <T extends OpenMenuPayload['args']>(menu: MenuName) => {
  const dispatch = useDispatch()

  const visible = useSelector(navigationSelectors.contextMenuVisibility(menu))
  // @ts-expect-error
  const props: T = useSelector(navigationSelectors.contextMenuProps(menu))

  const handleOpen = (args?: T) =>
    dispatch(
      navigationActions.openMenu({
        menu: menu,
        args: args
      })
    )

  const handleClose = () => dispatch(navigationActions.closeMenu(menu))

  return {
    visible,
    handleOpen,
    handleClose,
    ...props
  }
}
