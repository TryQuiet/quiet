import { useDispatch, useSelector } from 'react-redux'
import { navigationSelectors } from '../store/navigation/navigation.selectors'
import { navigationActions } from '../store/navigation/navigation.slice'

export const useConfirmationBox = (title = 'Ok', duration = 2000) => {
    const dispatch = useDispatch()

    const box = useSelector(navigationSelectors.confirmationBox())

    const flash = async () => {
        dispatch(
            navigationActions.toggleConfirmationBox({
                open: true,
                args: {
                    title,
                },
            })
        )
        await new Promise<void>(resolve => {
            setTimeout(() => {
                dispatch(
                    navigationActions.toggleConfirmationBox({
                        open: false,
                    })
                )
                resolve()
            }, duration)
        })
    }

    return {
        toggle: box.open,
        title: box.args?.title || title,
        flash,
    }
}
