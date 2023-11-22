import React, { FC, useEffect, useState } from 'react'
import { View } from 'react-native'
import { defaultPalette } from '../../styles/palettes/default.palette'

import { Appbar } from '../Appbar/Appbar.component'
import { Button } from '../Button/Button.component'
import { Typography } from '../Typography/Typography.component'

import { DeleteChannelProps } from './DeleteChannel.types'

export const DeleteChannel: FC<DeleteChannelProps> = ({ name, deleteChannel, handleBackButton }) => {
    const [displayedName, setDisplayedName] = useState<string>('')
    const [loading, setLoading] = useState<boolean>(false)

    const onPress = () => {
        setLoading(true)
        deleteChannel()
    }

    const goBack = () => {
        if (!loading) handleBackButton()
    }

    // Don't loose channel name during store cleanup
    useEffect(() => {
        if (name !== '') {
            setDisplayedName(name)
        }
    }, [name])

    return (
        <View style={{ flex: 1, backgroundColor: defaultPalette.background.white }} testID={'delete-channel-component'}>
            <Appbar title={'Delete channel'} back={goBack} />
            <View
                style={{
                    padding: 24,
                }}
            >
                <View>
                    <Typography fontSize={18} fontWeight={'medium'}>
                        Are you sure?
                    </Typography>
                </View>
                <View style={{ paddingTop: 16 }}>
                    <Typography fontSize={14}>
                        Channel{' '}
                        <Typography fontSize={14} fontWeight={'medium'}>
                            #{displayedName}
                        </Typography>{' '}
                        will be removed from the community. This cannot be undone.
                    </Typography>
                </View>
                <View style={{ paddingTop: 16 }}>
                    <Button title={'Delete channel'} onPress={onPress} loading={loading} />
                </View>
                <View>
                    <Button title={'Never mind'} onPress={goBack} negative />
                </View>
            </View>
        </View>
    )
}
