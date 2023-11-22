import React from 'react'
import { defaultTheme } from '../../styles/themes/default.theme'
import { View, Image, StyleSheet } from 'react-native'
import { Appbar } from '../Appbar/Appbar.component'
import { Typography } from '../Typography/Typography.component'
import ExclamationMark from '../../../assets/icons/exclamationMark.png'
import { Button } from '../Button/Button.component'
import { PossibleImpersonationAttackComponentProps } from '../../screens/PossibleImpersonationAttack/PossibleImpersonationAttack.types'

const classes = StyleSheet.create({
    mainWrapper: {
        padding: 20,
        alignItems: 'center',
        marginTop: 10,
    },
    image: {
        width: 96,
        height: 83,
    },
    title: {
        marginTop: 32,
        marginBottom: 24,
    },
    text1: {
        lineHeight: 20,
        textAlign: 'center',
    },
    text2: {
        lineHeight: 20,
        textAlign: 'center',
        marginBottom: 16,
    },
})

const PossibleImpersonationAttackComponent: React.FC<PossibleImpersonationAttackComponentProps> = ({
    handleBackButton,
    communityName,
}) => {
    return (
        <View
            style={{ flex: 1, backgroundColor: defaultTheme.palette.background.white }}
            testID={'possible-impersonation-attack-component'}
        >
            <Appbar title={'Warning!'} back={handleBackButton} crossBackIcon />
            <View style={classes.mainWrapper}>
                <Image source={ExclamationMark} style={classes.image} />

                <Typography fontSize={16} fontWeight={'medium'} style={classes.title}>
                    Possible impersonation attack
                </Typography>

                <Typography fontSize={14} style={classes.text1}>
                    The owner of{' '}
                    <Typography fontSize={14} fontWeight={'medium'}>
                        {communityName}
                    </Typography>{' '}
                    has registered an invalid username. Either something is very broken, the community owner is trying
                    to impersonate other users, or the community owner has been hacked.
                </Typography>

                <Typography fontSize={14} fontWeight={'bold'} style={classes.text2}>
                    This should never happen and we recommend leaving this community immediately!
                </Typography>
                {/* Temporarily hiding button - https://github.com/TryQuiet/quiet/issues/2025 */}
            </View>
        </View>
    )
}

export default PossibleImpersonationAttackComponent
