import { headerTopInset, sidebarMetrics } from './sidebarMetrics'

/** `ChannelHeader`'s root is 75px tall with its title centred. */
const CHANNEL_HEADER_HEIGHT = 75

describe('sidebar header inset', () => {
  it('leaves the macOS window-control strip clear', () => {
    expect(headerTopInset('darwin')).toBe(sidebarMetrics.header.windowControlsHeight)
  })

  it.each(['win32', 'linux'] as const)('on %s lines the community row up with the channel header title', platform => {
    const rowCentre = headerTopInset(platform) + sidebarMetrics.header.gap + sidebarMetrics.header.teamRowHeight / 2
    expect(Math.abs(rowCentre - CHANNEL_HEADER_HEIGHT / 2)).toBeLessThanOrEqual(1)
  })

  it('defaults to the running platform', () => {
    expect(headerTopInset()).toBe(headerTopInset(process.platform))
  })
})
