import { fireEvent } from '@testing-library/react-native'
import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'
import type { LinkedDevice } from '@quiet/types'

import { LinkDevices } from './LinkDevices.component'

const renderWithDevices = (linkedDevices?: LinkedDevice[]) =>
  renderComponent(
    <LinkDevices
      onDisplayQrCode={jest.fn()}
      onScanQrCode={jest.fn()}
      handleBackButton={jest.fn()}
      linkedDevices={linkedDevices}
    />
  )

/**
 * Link devices · Figma 2811:2575. The frame draws a titled bar, but the screen
 * repeats that title as its own large heading, and a page with a heading gets
 * no bar title: the bar zone keeps only the back glyph.
 */
describe('LinkDevices component', () => {
  it('renders the bar zone without a title; the heading is the title', () => {
    const { getByTestId, getAllByText, queryByTestId } = renderComponent(
      <LinkDevices onDisplayQrCode={jest.fn()} onScanQrCode={jest.fn()} handleBackButton={jest.fn()} />
    )

    expect(getByTestId('appbar_without_title')).toBeTruthy()
    expect(queryByTestId('appbar_title')).toBeNull()
    expect(getAllByText('Link devices')).toHaveLength(1)
  })

  it('still goes back from the glyph, and offers both QR routes', () => {
    const handleBackButton = jest.fn()
    const onDisplayQrCode = jest.fn()
    const onScanQrCode = jest.fn()
    const { getByTestId } = renderComponent(
      <LinkDevices onDisplayQrCode={onDisplayQrCode} onScanQrCode={onScanQrCode} handleBackButton={handleBackButton} />
    )

    fireEvent.press(getByTestId('appbar_action_item'))
    expect(handleBackButton).toHaveBeenCalled()

    fireEvent.press(getByTestId('link-devices-display-qr'))
    expect(onDisplayQrCode).toHaveBeenCalled()

    fireEvent.press(getByTestId('link-devices-scan-qr'))
    expect(onScanQrCode).toHaveBeenCalled()
  })

  it('lists the other devices on the account', () => {
    const { getByTestId, queryByTestId } = renderWithDevices([
      { deviceId: 'this', deviceName: 'pixel-here', isCurrent: true },
      { deviceId: 'laptop', deviceName: 'nyc-laptop', isCurrent: false },
      { deviceId: 'tablet', deviceName: 'nyc-tablet', isCurrent: false },
    ])

    expect(getByTestId('linked-devices-list')).toBeTruthy()
    expect(getByTestId('linked-devices-list-label')).toBeTruthy()
    expect(getByTestId('linked-devices-scroll')).toBeTruthy()
    expect(getByTestId('linked-device-laptop')).toBeTruthy()
    expect(getByTestId('linked-device-tablet')).toBeTruthy()
    expect(queryByTestId('no-linked-devices')).toBeNull()
  })

  it('leaves this device out of the list it is read from', () => {
    const { getByTestId, queryByTestId } = renderWithDevices([
      { deviceId: 'this', deviceName: 'pixel-here', isCurrent: true },
    ])

    expect(queryByTestId('linked-device-this')).toBeNull()
    expect(getByTestId('no-linked-devices')).toBeTruthy()
  })

  it('drops a device that was removed from the account', () => {
    const { getByTestId, queryByTestId } = renderWithDevices([
      { deviceId: 'this', deviceName: 'pixel-here', isCurrent: true },
      { deviceId: 'gone', deviceName: 'old-tablet', isCurrent: false, removedAt: Date.now() },
      { deviceId: 'laptop', deviceName: 'nyc-laptop', isCurrent: false },
    ])

    expect(queryByTestId('linked-device-gone')).toBeNull()
    expect(getByTestId('linked-device-laptop')).toBeTruthy()
  })

  it('says so when this is the only device', () => {
    const { getByTestId } = renderWithDevices([])

    expect(getByTestId('linked-devices-list')).toBeTruthy()
    expect(getByTestId('no-linked-devices')).toBeTruthy()
  })

  it('draws no list until a read comes back, so it never says "No linked devices" first', () => {
    const { queryByTestId } = renderWithDevices(undefined)

    expect(queryByTestId('linked-devices-list')).toBeNull()
    expect(queryByTestId('no-linked-devices')).toBeNull()
  })
})
