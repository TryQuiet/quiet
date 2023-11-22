import React, { FC } from 'react'
import { useDispatch } from 'react-redux'
import { Error } from '../../components/Error/Error.component'
import { ErrorScreenProps } from './Error.types'

export const ErrorScreen: FC<ErrorScreenProps> = ({ route }) => {
    const dispatch = useDispatch()
    const onPress = () => route.params.onPress(dispatch)
    return (
        <Error onPress={onPress} icon={route.params.icon} title={route.params.title} message={route.params.message} />
    )
}
