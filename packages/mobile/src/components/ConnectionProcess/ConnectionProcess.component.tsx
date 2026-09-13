import React, { FC, useRef, useEffect } from 'react'
import { View, TouchableWithoutFeedback, Animated, Easing } from 'react-native'
import Config from 'react-native-config'
import { defaultPalette } from '../../styles/palettes/default.palette'
import { Typography } from '../Typography/Typography.component'
import { ConnectionProcessComponentProps } from './ConnectionProcess.types'
import { icons } from '../../assets'
import { Site } from '@quiet/common'
import { ConnectionProcessInfo } from '@quiet/types'
import { NodeEnv } from '../../utils/const/NodeEnv.enum'
import { sendLogs } from '../../utils/sendLogs'
import { shareAllData } from '../../utils/shareAllData'

/**
 * Progress while joining or creating, which is two screens (decided 2026-09-13):
 *
 * - over **Tor**, `Joining now` with the explanation (Quiet Design Library
 *   0j7Nna9zWmfOSNmRmQK1Uh `5978:19161`) and `Connecting via Tor` under the bar
 *   (y8h6w8PYR9jyI3zjYHL9Cl `1316:34596`);
 * - on a **server** (QSS), the simple `Joining now` (`5978:19142`, and
 *   `2894:3382` inside the community chrome): globe, title, bar, and the status
 *   line this screen already prints. No Tor paragraph, no Tor link — a
 *   community on a server is not reached over Tor, so none of that is true
 *   of it.
 *
 * Bar: 300x4 r100, `#F0F0F0` track, teal `#67BFD3` fill (decision 2026-09-13;
 * the mobile frames draw the library default blue `#1B6FEC`).
 */

/**
 * The explanation, from `Joining now` (`5978:19167`). Every line is the
 * designer's except the first.
 *
 * The frame opens `You can exit the app - we'll notify you once you're
 * connected!`. Half of that holds here: leaving the app does not stop a Tor
 * join, because `CommunicationModule.syncBackendWorkerState` keeps the backend
 * worker running for any community that is not on a server, and the worker is a
 * dataSync foreground service. Nothing notifies you when the join finishes,
 * though - the only notifications the app posts are incoming messages and the
 * foreground service's own. So the promise goes and the permission stays.
 */
export const TOR_EXPLANATION_LEAD = 'You can exit the app while you connect.\u00a0 '
export const TOR_EXPLANATION_EMPHASIS = 'This first time might take 30 seconds, 10 minutes, or even longer.'
export const TOR_EXPLANATION_REST_BEFORE_YOUR = "\n\nThere's a good reason why it's slow: Quiet stores data on "
export const TOR_EXPLANATION_REST_AFTER_YOUR =
  ' community’s devices (not Big Tech’s servers!) and uses the battle-tested privacy tool Tor to protect your information. Tor is fast once connected, but can take a long time to connect at first.'
export const TOR_LEARN_MORE = 'Learn more about Tor and Quiet'

/** The status under the bar on the Tor screen, from `Joining` (`1316:34596`). */
export const TOR_STATUS = 'Connecting via Tor'

/** Progress bar base 2 (`5390:18021`): 300x4, radius 100. */
const TRACK_WIDTH = 300
const TRACK_HEIGHT = 4

const ConnectionProcessComponent: FC<ConnectionProcessComponentProps> = ({
  connectionProcess,
  openUrl,
  usesServer = false,
}) => {
  const animationValue = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.loop(
      Animated.timing(animationValue, {
        toValue: 1,
        duration: 7000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start()
  }, [])

  const transformValues = animationValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })

  const processAnimation = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (connectionProcess.text === ConnectionProcessInfo.CONNECTING_TO_COMMUNITY) {
      Animated.loop(
        Animated.timing(processAnimation, {
          toValue: 1,
          duration: 6000,
          easing: Easing.linear,
          useNativeDriver: false,
        })
      ).start()
    } else {
      processAnimation.stopAnimation()
    }
  }, [processAnimation, connectionProcess])

  const processAnimationWidth = processAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [150, TRACK_WIDTH],
  })

  // Tor names its own connection; a server screen keeps the phase the app reports.
  const status = usesServer ? connectionProcess.text : TOR_STATUS
  const secondary = usesServer ? undefined : connectionProcess.text

  return (
    <View style={{ flex: 1, backgroundColor: defaultPalette.background.white }} testID={'connection-process-component'}>
      <View
        style={{
          padding: '10%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          width: '100%',
        }}
      >
        <Animated.Image
          style={{ transform: [{ rotate: transformValues }], width: 120, height: 120 }}
          source={icons.join_community}
        />
        <Typography variant={'title'} style={{ marginTop: 24, marginBottom: 16 }} testID={'connection-process-title'}>
          Joining now!
        </Typography>

        <View
          style={{
            width: TRACK_WIDTH,
            height: TRACK_HEIGHT,
            backgroundColor: defaultPalette.background.gray06,
            borderRadius: 100,
            position: 'relative',
            zIndex: 1,
          }}
        >
          <View
            style={{
              backgroundColor: defaultPalette.background.lushSky,
              height: TRACK_HEIGHT,
              width: connectionProcess.number * 3,
              borderRadius: 100,
              position: 'relative',
              zIndex: 3,
            }}
          ></View>

          {connectionProcess.text === ConnectionProcessInfo.CONNECTING_TO_COMMUNITY && (
            <Animated.View
              style={{
                backgroundColor: defaultPalette.background.lushSky,
                height: TRACK_HEIGHT,
                width: processAnimationWidth,
                borderRadius: 100,
                position: 'absolute',
                zIndex: 2,
              }}
            />
          )}
        </View>
        <Typography testID='connection-process-text' variant={'body'} style={{ textAlign: 'center', marginTop: 8 }}>
          {status}
        </Typography>

        {secondary != null && (
          <Typography
            testID='connection-process-secondary'
            variant={'caption'}
            color={'gray50'}
            style={{ textAlign: 'center', marginTop: 6 }}
          >
            {secondary}
          </Typography>
        )}

        {!usesServer && (
          <>
            <Typography
              testID='connection-process-tor-explanation'
              variant={'body'}
              color={'gray70'}
              style={{ textAlign: 'center', marginTop: 40 }}
            >
              {TOR_EXPLANATION_LEAD}
              <Typography variant={'subtitle'} color={'gray70'}>
                {TOR_EXPLANATION_EMPHASIS}
              </Typography>
              {TOR_EXPLANATION_REST_BEFORE_YOUR}
              <Typography variant={'body'} color={'gray70'} style={{ fontStyle: 'italic' }}>
                your
              </Typography>
              {TOR_EXPLANATION_REST_AFTER_YOUR}
            </Typography>

            <TouchableWithoutFeedback onPress={() => openUrl(Site.MAIN_PAGE)} testID={'learn-more-link'}>
              <Typography variant={'body'} color={'blue'} style={{ textAlign: 'center', marginTop: 40 }}>
                {TOR_LEARN_MORE}
              </Typography>
            </TouchableWithoutFeedback>
          </>
        )}

        {Config.NODE_ENV !== NodeEnv.Production && (
          <>
            <TouchableWithoutFeedback onPress={() => void sendLogs()} testID={'share-logs-link'}>
              <Typography variant={'body'} color={'blue'} style={{ textAlign: 'center', marginTop: 16 }}>
                Share logs
              </Typography>
            </TouchableWithoutFeedback>

            <TouchableWithoutFeedback onPress={() => void shareAllData()} testID={'share-all-data-link'}>
              <Typography variant={'body'} color={'blue'} style={{ textAlign: 'center', marginTop: 16 }}>
                Share all data
              </Typography>
            </TouchableWithoutFeedback>
          </>
        )}
      </View>
    </View>
  )
}

export default ConnectionProcessComponent
