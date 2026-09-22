import React from 'react'

import { renderComponent } from '../../tests/utils/renderComponent'
import { prepareStore } from '../../tests/utils/prepareStore'

import { ONBOARDING_BAR_ZONE_HEIGHT, ONBOARDING_BLOCK_GAP, ONBOARDING_STAGE_INSET } from '../../styles/const/onboarding'
import { BAR_ZONE_HEIGHT } from '../Appbar/Appbar.component'
import { ONBOARDING_BODY_TEST_ID } from './OnboardingBody.component'

import { GetStarted } from '../GetStarted/GetStarted.component'
import { JoinCommunityOptions } from '../JoinCommunityOptions/JoinCommunityOptions.component'
import { RecoverAccount } from '../RecoverAccount/RecoverAccount.component'
import { OpenInviteLink } from '../OpenInviteLink/OpenInviteLink.component'
import { LinkDevices } from '../LinkDevices/LinkDevices.component'
import { CreateCommunity } from '../CreateCommunity/CreateCommunity.component'
import { JoinCommunity } from '../JoinCommunity/JoinCommunity.component'
import { UsernameRegistration } from '../Registration/UsernameRegistration.component'
import { UsernameVariant } from '../Registration/UsernameRegistration.types'

/**
 * One vertical rhythm for the whole class.
 *
 * The complaint this pins down was that moving between onboarding screens jumped
 * vertically: Get started had no bar zone and centred its block, while Join
 * community reserved the zone and put its graphic flush against it, so two
 * screens one tap apart landed their content 76 apart. The fix is that no stage
 * sets its own top padding or block gap — they all take `onboardingStageBody` —
 * so this checks the property rather than the screens that have it today.
 */

const noop = () => undefined

/** A KeyboardAvoidingView hands its style down as an array; flatten before reading it. */
const flatten = (style: unknown): Record<string, unknown> =>
  Array.isArray(style) ? Object.assign({}, ...style.map(flatten)) : ((style ?? {}) as Record<string, unknown>)

/** Every full-screen onboarding stage, with whatever props make it render. */
const stages: [string, () => React.ReactElement][] = [
  ['Get started', () => <GetStarted onJoinCommunity={noop} onCreateCommunity={noop} onLinkDevices={noop} />],
  [
    'Join community',
    () => (
      <JoinCommunityOptions
        onJoinWithInviteLink={noop}
        onJoinWithQrCode={noop}
        onRecoverAccount={noop}
        handleBackButton={noop}
      />
    ),
  ],
  ['Recover account', () => <RecoverAccount onUseLinkedDevice={noop} onUseInviteLink={noop} handleBackButton={noop} />],
  ['Open invite link', () => <OpenInviteLink onPasteLink={noop} handleBackButton={noop} />],
  [
    'Link devices',
    () => <LinkDevices direction='share' onDisplayQrCode={noop} onCopyLink={noop} handleBackButton={noop} />,
  ],
  [
    'Link devices · receive',
    () => <LinkDevices direction='receive' onScanQrCode={noop} onPasteLink={noop} handleBackButton={noop} />,
  ],
  [
    'Create a community',
    () => <CreateCommunity createCommunityAction={noop} handleBackButton={noop} networkCreated={false} ready={true} />,
  ],
  [
    'Paste a link to join',
    () => <JoinCommunity joinCommunityAction={noop} handleBackButton={noop} hasReceivedResponse={false} ready={true} />,
  ],
  [
    'Choose username',
    () => (
      <UsernameRegistration registerUsernameAction={noop} usernameRegistered={false} variant={UsernameVariant.NEW} />
    ),
  ],
  [
    'Username taken',
    () => (
      <UsernameRegistration
        registerUsernameAction={noop}
        usernameRegistered={false}
        currentUsername={'taken'}
        variant={UsernameVariant.TAKEN}
        handleBackButton={noop}
      />
    ),
  ],
]

describe('Onboarding vertical rhythm', () => {
  it.each(stages)('%s puts its column at the class inset, with the class gap', async (_name, render) => {
    const { store } = await prepareStore()
    const { getByTestId } = renderComponent(render(), store)

    const body = getByTestId(ONBOARDING_BODY_TEST_ID)
    expect(flatten(body.props.style)).toMatchObject({
      paddingTop: ONBOARDING_STAGE_INSET,
      gap: ONBOARDING_BLOCK_GAP,
    })
  })

  it.each(stages)('%s reserves the bar zone above that column', async (_name, render) => {
    const { store } = await prepareStore()
    const { UNSAFE_root } = renderComponent(render(), store)

    // Every stage draws a bar zone, glyph or no glyph; only the entry's is empty.
    const barZones = UNSAFE_root.findAll(node => typeof node.type === 'string').filter(node => {
      const style = flatten(node.props.style)
      // `Appbar withoutTitle` sets the height inline; the titled bar takes it from
      // StyledAppbar's min-height. Both reserve the same 60.
      return style.height === ONBOARDING_BAR_ZONE_HEIGHT || style.minHeight === ONBOARDING_BAR_ZONE_HEIGHT
    })
    expect(barZones.length).toBeGreaterThanOrEqual(1)
  })

  it('leaves Get started an empty bar zone: reserved, but no glyph and no title', async () => {
    const { store } = await prepareStore()
    const { getByTestId, queryByTestId, queryByText } = renderComponent(
      <GetStarted onJoinCommunity={noop} onCreateCommunity={noop} onLinkDevices={noop} />,
      store
    )

    expect(getByTestId('appbar_without_title')).toBeTruthy()
    expect(queryByTestId('appbar_action_item')).toBeNull()
    expect(queryByText('Quiet')).toBeNull()
  })

  it('does not centre any stage: the block is top-anchored everywhere', async () => {
    for (const [name, render] of stages) {
      const { store } = await prepareStore()
      const { getByTestId } = renderComponent(render(), store)
      const style = flatten(getByTestId(ONBOARDING_BODY_TEST_ID).props.style)
      expect(`${name}: ${style.justifyContent ?? 'flex-start'}`).toBe(`${name}: flex-start`)
    }
  })

  it('keeps the bar zone height in one place', () => {
    expect(BAR_ZONE_HEIGHT).toBe(ONBOARDING_BAR_ZONE_HEIGHT)
  })
})
