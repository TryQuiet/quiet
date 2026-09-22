import React from 'react'
import { renderComponent } from '../../testUtils/renderComponent'
import JoiningPanelComponent from './JoiningPanelComponent'
import { TOR_LEARN_MORE, TOR_STATUS } from './TorJoiningPanel'
import { ConnectionProcessInfo } from '@quiet/types'

const connectionInfo = { number: 50, text: ConnectionProcessInfo.BACKEND_MODULES }

const render = (props: Partial<React.ComponentProps<typeof JoiningPanelComponent>> = {}) =>
  renderComponent(
    <JoiningPanelComponent
      handleClose={jest.fn()}
      openUrl={jest.fn()}
      open={true}
      isOwner={false}
      connectionInfo={connectionInfo}
      {...props}
    />
  )

describe('JoiningPanelComponent', () => {
  describe('over Tor', () => {
    it('explains Tor, and names Tor under the bar', () => {
      const result = render({ usesServer: false })

      expect(result.getByTestId('torJoiningPanel')).toBeTruthy()
      expect(result.getByTestId('actionProgressStatus').textContent).toBe(TOR_STATUS)
      expect(result.getByTestId('torExplanation').textContent).toContain('privacy tool Tor')
      expect(result.getByText(TOR_LEARN_MORE)).toBeTruthy()
    })

    it('keeps the phase the app reports, under the status', () => {
      const result = render({ usesServer: false })

      expect(result.getByTestId('actionProgressSecondary').textContent).toBe(ConnectionProcessInfo.BACKEND_MODULES)
    })

    it('drops the explanation for the owner, who is creating rather than joining', () => {
      const result = render({ usesServer: false, isOwner: true })

      expect(result.getByText('Creating your community!')).toBeTruthy()
      expect(result.queryByTestId('torExplanation')).toBeNull()
      expect(result.queryByText(TOR_LEARN_MORE)).toBeNull()
    })
  })

  describe('on a server', () => {
    it('says nothing about Tor', () => {
      const result = render({ usesServer: true, communityName: 'Rockets' })

      expect(result.getByTestId('serverJoiningPanel')).toBeTruthy()
      expect(result.queryByTestId('torJoiningPanel')).toBeNull()
      expect(result.queryByTestId('torExplanation')).toBeNull()
      expect(result.queryByText(TOR_LEARN_MORE)).toBeNull()
      expect(result.baseElement.textContent).not.toContain('Tor')
    })

    it('names the community it is joining', () => {
      const result = render({ usesServer: true, communityName: 'Rockets' })

      expect(result.getByTestId('actionProgressStatus').textContent).toBe('Joining community “Rockets”')
    })

    it('names the community it is creating, for the owner', () => {
      const result = render({ usesServer: true, isOwner: true, communityName: 'Rockets' })

      expect(result.getByTestId('actionProgressStatus').textContent).toBe('Creating community “Rockets”')
    })

    it('keeps the phase the app reports, under the status', () => {
      const result = render({ usesServer: true, communityName: 'Rockets' })

      expect(result.getByTestId('actionProgressSecondary').textContent).toBe(ConnectionProcessInfo.BACKEND_MODULES)
    })
  })
})
