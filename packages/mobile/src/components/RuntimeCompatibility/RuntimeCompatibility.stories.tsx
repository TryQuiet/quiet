import React, { useEffect, useRef, useState } from 'react'
import { Button, NativeEventEmitter, NativeModules, Platform, Text, View } from 'react-native'
import { storiesOf } from '@storybook/react-native'
import WebviewCrypto from 'react-native-webview-crypto'
import { getCrypto, setEngine } from 'pkijs'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'

const initialResults = {
  state: 'idle',
  digest: 'pending',
  keyRoundTrip: 'pending',
  signature: 'pending',
  tamper: 'pending',
  error: '',
}

const RuntimeCompatibilityStory = () => {
  const [results, setResults] = useState(initialResults)
  const mounted = useRef(true)
  const running = useRef(false)
  const isHermes = Boolean(Reflect.get(global, 'HermesInternal'))
  const isWebViewProvider = Reflect.get(global.crypto.subtle, 'fake') === true
  const isBridgeless = Reflect.get(global, 'RN$Bridgeless') === true
  const isFabric = Boolean(Reflect.get(global, 'nativeFabricUIManager'))
  const [nativeRoundTrip, setNativeRoundTrip] = useState('pending')
  const [notification, setNotification] = useState('none')
  const [lifecycle, setLifecycle] = useState({ pauses: 0, resumes: 0 })

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  useEffect(() => {
    const communication = NativeModules.CommunicationModule
    const emitter = new NativeEventEmitter(communication)
    const marker = 'quiet-native-round-trip'
    const subscriptions = [
      emitter.addListener('backend', event => {
        const received =
          Platform.OS === 'android'
            ? event.channelName === '_INIT_CHECK_' && event.payload === marker
            : event.channelName === '_WEBSOCKET_CONNECTION_' && typeof event.payload?.dataPort === 'number'
        // The iOS response also contains the socket secret. Never display it.
        if (received) setNativeRoundTrip('passed')
      }),
      emitter.addListener('notification', channel => setNotification(String(channel))),
    ]
    if (Platform.OS === 'ios') {
      subscriptions.push(
        emitter.addListener('apppause', () => setLifecycle(value => ({ ...value, pauses: value.pauses + 1 }))),
        emitter.addListener('appresume', () => setLifecycle(value => ({ ...value, resumes: value.resumes + 1 })))
      )
    }
    communication.handleIncomingEvents('_INIT_CHECK_', marker, '')
    return () => subscriptions.forEach(subscription => subscription.remove())
  }, [])

  const update = (next: Partial<typeof initialResults>) => {
    if (mounted.current) setResults(previous => ({ ...previous, ...next }))
  }

  const runChecks = async () => {
    if (running.current) return
    running.current = true
    setResults({ ...initialResults, state: 'running' })

    try {
      if (!isHermes) throw new Error('The UI must run in Hermes')
      if (!isBridgeless || !isFabric) throw new Error('The UI must use Fabric and the bridgeless React host')
      if (!isWebViewProvider) throw new Error('WebCrypto must use the mounted WebView bridge')

      // Use the same registration as rootSaga, without importing the persisted
      // store or starting application/backend sagas in this isolated story.
      setEngine('newEngine', global.crypto, global.crypto.subtle)
      const engine = getCrypto(true)

      // A known digest checks the bytes crossing the native WebView boundary,
      // independently of the key/signature operations agreeing with each other.
      const digest = await engine.digest('SHA-256', new Uint8Array([97, 98, 99]))
      const digestHex = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
      if (digestHex !== 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad') {
        throw new Error('SHA-256 did not match the expected digest')
      }
      update({ digest: 'passed' })

      const algorithm = { name: 'ECDSA', namedCurve: 'P-256' }
      const keys = await engine.generateKey(algorithm, true, ['sign', 'verify'])
      const exportedKey = await engine.exportKey('spki', keys.publicKey)
      const publicKey = await engine.importKey('spki', exportedKey, algorithm, true, ['verify'])
      update({ keyRoundTrip: 'passed' })

      const message = new Uint8Array([81, 117, 105, 101, 116])
      const signAlgorithm = { name: 'ECDSA', hash: 'SHA-256' }
      const signature = await engine.sign(signAlgorithm, keys.privateKey, message)
      if (!(await engine.verify(signAlgorithm, publicKey, signature, message))) {
        throw new Error('The exported and imported public key did not verify the signature')
      }
      update({ signature: 'verified' })

      const changedMessage = new Uint8Array(message)
      changedMessage[0] ^= 1
      if (await engine.verify(signAlgorithm, publicKey, signature, changedMessage)) {
        throw new Error('Verification accepted a modified message')
      }
      update({ tamper: 'rejected', state: 'passed' })
    } catch (error) {
      const message =
        typeof error === 'object' && error !== null && 'message' in error ? String(error.message) : String(error)
      update({ state: 'failed', error: message })
    } finally {
      running.current = false
    }
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
        {/* Exactly one real provider is mounted for this story. Its own unmount
            cleanup resets the shared worker before another story can mount it. */}
        <WebviewCrypto />
        <View style={{ padding: 16, gap: 8 }}>
          <Text>React Native runtime compatibility</Text>
          <Text testID='runtime-compatibility-engine'>{isHermes ? 'Hermes' : 'Other engine'}</Text>
          <Text testID='runtime-compatibility-architecture'>
            {isBridgeless && isFabric ? 'Fabric bridgeless' : 'Legacy'}
          </Text>
          <Text testID='runtime-compatibility-native-module'>{nativeRoundTrip}</Text>
          <Text testID='runtime-compatibility-notification'>{notification}</Text>
          <Text testID='runtime-compatibility-lifecycle'>{`${lifecycle.pauses}/${lifecycle.resumes}`}</Text>
          <Text testID='runtime-compatibility-provider'>{isWebViewProvider ? 'WebView bridge' : 'Other provider'}</Text>
          <Text testID='runtime-compatibility-state'>{results.state}</Text>
          <Text testID='runtime-compatibility-digest'>{results.digest}</Text>
          <Text testID='runtime-compatibility-key-round-trip'>{results.keyRoundTrip}</Text>
          <Text testID='runtime-compatibility-signature'>{results.signature}</Text>
          <Text testID='runtime-compatibility-tamper'>{results.tamper}</Text>
          <Text testID='runtime-compatibility-error'>{results.error || 'none'}</Text>
          <Button
            title='Run WebCrypto checks'
            testID='runtime-compatibility-run'
            disabled={results.state === 'running'}
            onPress={() => void runChecks()}
          />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  )
}

storiesOf('RuntimeCompatibility', module).add('HermesWebCrypto', () => <RuntimeCompatibilityStory />)
