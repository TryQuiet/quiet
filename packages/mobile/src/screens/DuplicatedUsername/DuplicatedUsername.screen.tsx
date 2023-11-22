import React, { FC, useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { ScreenNames } from '../../const/ScreenNames.enum'
import DuplicatedUsernameComponent from '../../components/UserLabel/Duplicated/DuplicatedUsername.component'
import { DuplicatedUsernameScreenProps } from './DuplicatedUsername.types'

export const DuplicatedUsernameScreen: FC<DuplicatedUsernameScreenProps> = ({ route }) => {
    const dispatch = useDispatch()

    const handleBackButton = useCallback(() => {
        dispatch(
            navigationActions.replaceScreen({
                screen: ScreenNames.ChannelScreen,
            })
        )
    }, [dispatch])

    return <DuplicatedUsernameComponent handleBackButton={handleBackButton} />
}
