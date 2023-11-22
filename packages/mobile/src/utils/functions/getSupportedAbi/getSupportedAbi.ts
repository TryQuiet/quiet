import DeviceInfo from 'react-native-device-info'

export const getSupportedAbi = async () => {
    await DeviceInfo.supportedAbis().then((abis: string[]) => abis[0])
}
