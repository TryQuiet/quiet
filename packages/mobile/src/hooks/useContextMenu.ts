import { useDispatch, useSelector } from 'react-redux'
import { MenuName } from '../const/MenuNames.enum'
import { navigationSelectors } from '../store/navigation/navigation.selectors'
import { navigationActions, OpenMenuPayload } from '../store/navigation/navigation.slice'

export type UseContextMenuType<T extends OpenMenuPayload['args']> = ReturnType<typeof useContextMenu<T>>

export const useContextMenu = <T extends OpenMenuPayload['args']>(menu: MenuName) => {
    const dispatch = useDispatch()

    const visible = useSelector(navigationSelectors.contextMenuVisibility(menu))
    // @ts-expect-error
    const props: T = useSelector(navigationSelectors.contextMenuProps(menu))

    const handleOpen = (args?: T) =>
        dispatch(
            navigationActions.openMenu({
                menu,
                args,
            })
        )

    const handleClose = () => dispatch(navigationActions.closeMenu(menu))

    return {
        visible,
        handleOpen,
        handleClose,
        ...props,
    }
}
