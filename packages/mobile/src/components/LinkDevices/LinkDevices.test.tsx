import { fireEvent } from '@testing-library/react-native'
import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'
import { LinkDevices } from './LinkDevices.component'

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
      <LinkDevices
        onDisplayQrCode={onDisplayQrCode}
        onScanQrCode={onScanQrCode}
        handleBackButton={handleBackButton}
      />
    )

    fireEvent.press(getByTestId('appbar_action_item'))
    expect(handleBackButton).toHaveBeenCalled()

    fireEvent.press(getByTestId('link-devices-display-qr'))
    expect(onDisplayQrCode).toHaveBeenCalled()

    fireEvent.press(getByTestId('link-devices-scan-qr'))
    expect(onScanQrCode).toHaveBeenCalled()
  })
})
