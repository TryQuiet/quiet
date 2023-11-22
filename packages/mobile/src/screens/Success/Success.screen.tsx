import React, { FC } from 'react'
import { Success } from '../../components/Success/Success.component'
import { SuccessScreenProps } from './Success.types'

export const SuccessScreen: FC<SuccessScreenProps> = ({ route }) => {
    return (
        <Success
            onPress={route.params.onPress}
            icon={route.params.icon}
            title={route.params.title}
            message={route.params.message}
        />
    )
}
