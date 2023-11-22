import React, { FC, useEffect, useState } from 'react'
import { View } from 'react-native'
import { defaultPalette } from '../../styles/palettes/default.palette'
import { Appbar } from '../Appbar/Appbar.component'
import { Button } from '../Button/Button.component'
import { Typography } from '../Typography/Typography.component'

import { LeaveCommunityProps } from './LeaveCommunity.types'

export const LeaveCommunity: FC<LeaveCommunityProps> = ({ name, leaveCommunity, handleBackButton }) => {
    const [displayedName, setDisplayedName] = useState<string>('')
    const [loading, setLoading] = useState<boolean>(false)

    const onPress = () => {
        setLoading(true)
        leaveCommunity()
    }

    const goBack = () => {
        if (!loading) handleBackButton()
    }

    // Don't loose community name during store cleanup
    useEffect(() => {
        if (name !== '') {
            setDisplayedName(name)
        }
    }, [name])

    return (
        <View
            style={{ flex: 1, backgroundColor: defaultPalette.background.white }}
            testID={'leave-community-component'}
        >
            <Appbar title={'Leave community'} back={goBack} />
            <View
                style={{
                    padding: 24,
                }}
            >
                <View>
                    <Typography fontSize={18} fontWeight={'medium'}>
                        Are you sure you want to leave?
                    </Typography>
                </View>
                <View style={{ paddingTop: 16 }}>
                    <Typography fontSize={14}>
                        Your account, messages, and all data for{' '}
                        <Typography fontSize={14} fontWeight={'medium'}>
                            {displayedName}
                        </Typography>{' '}
                        will be deleted from this device. This cannot be undone.
                    </Typography>
                </View>
                <View style={{ paddingTop: 16 }}>
                    <Button title={'Leave community'} onPress={onPress} loading={loading} />
                </View>
                <View>
                    <Button title={"Never mind, I'll stay"} onPress={goBack} negative />
                </View>
            </View>
        </View>
    )
}
