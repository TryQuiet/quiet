import React from 'react'
import { renderComponent } from '../../testUtils/renderComponent'
import TorJoiningPanel, {
  TOR_EXPLANATION_EMPHASIS,
  TOR_EXPLANATION_LEAD,
  TOR_EXPLANATION_REST_AFTER_YOUR,
  TOR_LEARN_MORE,
  TOR_STATUS,
} from './TorJoiningPanel'
import { ConnectionProcessInfo } from '@quiet/types'

const connectionInfo = { number: 50, text: ConnectionProcessInfo.BACKEND_MODULES }

const render = (props: Partial<React.ComponentProps<typeof TorJoiningPanel>> = {}) =>
  renderComponent(
    <TorJoiningPanel
      open={true}
      handleClose={jest.fn()}
      openUrl={jest.fn()}
      isOwner={false}
      connectionInfo={connectionInfo}
      {...props}
    />
  )

describe('TorJoiningPanel', () => {
  it('carries the explanation as the design writes it', () => {
    const result = render()
    const explanation = result.getByTestId('torExplanation').textContent ?? ''

    expect(explanation).toContain(TOR_EXPLANATION_LEAD.trim())
    expect(explanation).toContain(TOR_EXPLANATION_EMPHASIS)
    expect(explanation).toContain(TOR_EXPLANATION_REST_AFTER_YOUR.trim())
    expect(explanation).toContain('your community’s devices')
  })

  it('does not tell a desktop user they can leave', () => {
    const result = render()
    const explanation = result.getByTestId('torExplanation').textContent ?? ''

    // Closing the window quits the app and stops the join, and nothing notifies
    // afterwards, so the frame's opening sentence is not made here.
    expect(explanation).toContain('Keep Quiet open while you connect.')
    expect(explanation).not.toContain('You can exit the app')
    expect(explanation).not.toContain('notify you')
  })

  it('names Tor as the connection under way', () => {
    const result = render()

    expect(result.getByTestId('actionProgressStatus').textContent).toBe(TOR_STATUS)
    expect(result.getByTestId('actionProgressSecondary').textContent).toBe(ConnectionProcessInfo.BACKEND_MODULES)
  })

  it('fills the bar to the phase the app reports', () => {
    const result = render()

    expect(result.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('50')
  })

  it('opens the Tor explainer when the link is clicked', () => {
    const openUrl = jest.fn()
    const result = render({ openUrl })

    result.getByTestId('torLearnMore').click()
    expect(openUrl).toHaveBeenCalledTimes(1)
  })

  it('titles the screen for whoever is waiting', () => {
    const joiner = render()
    expect(joiner.getByText('Joining now!')).toBeTruthy()
  })

  it('titles the screen for the owner', () => {
    const owner = render({ isOwner: true })
    expect(owner.getByText('Creating your community!')).toBeTruthy()
  })

  it('shows the owner no explanation and no link', () => {
    const result = render({ isOwner: true })

    expect(result.queryByTestId('torExplanation')).toBeNull()
    expect(result.queryByText(TOR_LEARN_MORE)).toBeNull()
  })
})
