// Which shipping component, if any, implements each stage of the Figma onboarding
// prototype. Paths are relative to packages/ and were checked to exist on this
// branch; entries marked pr3400 exist only in TryQuiet/quiet#3400 (device linking).
// "none" is a statement of fact, not a placeholder to fill with a mock.
export type Impl = { path: string; status: 'on-branch' | 'pr3400' } | { status: 'none'; why: string }
export interface StageImpl {
  desktop: Impl
  mobile: Impl
  /** Where design and implementation disagree in kind, not just in styling. */
  divergence?: string
}
const none = (why: string): Impl => ({ status: 'none', why })
const on = (path: string): Impl => ({ path, status: 'on-branch' })
const pr = (path: string): Impl => ({ path, status: 'pr3400' })

export const IMPLEMENTATION: Record<string, StageImpl> = {
  'get-started': {
    desktop: on('desktop/src/renderer/components/Onboarding/GetStarted.tsx'),
    mobile: on('mobile/src/screens/GetStarted/GetStarted.screen.tsx'),
  },
  'join-community': {
    desktop: on('desktop/src/renderer/components/Onboarding/JoinCommunityOptionsComponent.tsx'),
    mobile: on('mobile/src/components/JoinCommunityOptions/JoinCommunityOptions.component.tsx'),
    divergence: 'Join with QR code lands on the paste step: neither app has a scanner on this branch.',
  },
  'open-invite-link': {
    desktop: on('desktop/src/renderer/components/Onboarding/OpenInviteLinkComponent.tsx'),
    mobile: on('mobile/src/components/OpenInviteLink/OpenInviteLink.component.tsx'),
    divergence:
      'An invite link opened while this screen shows takes the deep-link path (desktop customProtocol.saga.ts, mobile deepLink.saga.ts) straight to Choose username.',
  },
  container: {
    desktop: on('desktop/src/renderer/components/Onboarding/PasteLinkComponent.tsx'),
    mobile: on('mobile/src/screens/PasteInviteLink/PasteInviteLink.screen.tsx'),
    divergence: "The WIP frame reduced to its intent: heading, one input ('Link'), Continue.",
  },
  'want-a-server': {
    desktop: on('desktop/src/renderer/components/ServerOffer/ServerOfferComponent.tsx'),
    mobile: on('mobile/src/components/ServerOffer/ServerOffer.component.tsx'),
    divergence:
      'Both apps render the frame itself (design/want-a-server), but reach it during community creation; the design reaches it from Home → Add members, after the community exists. On mobile it is a screen, not the bottom drawer it used to arrive in.',
  },
  'no-server': {
    desktop: none('declining is a button on the offer itself; there is no confirmation screen'),
    mobile: none('declining is a button on the offer itself; there is no confirmation screen'),
  },
  'choose-a-plan': {
    desktop: none('no plans or subscriptions exist'),
    mobile: none('no plans or subscriptions exist'),
  },
  'agree-and-join-v-1-before-we-support-multiple-hosts': {
    desktop: on('desktop/src/renderer/components/TermsOfService/TermsOfServiceComponent.tsx'),
    mobile: on('mobile/src/components/ServerOffer/JoiningOptIn/JoiningOptIn.component.tsx'),
    divergence:
      'Design: one Agree & Join screen reached from nowhere. Implementation: an opt-in drawer plus a separate Terms of Service screen, shown after username (mobile) / on join (desktop).',
  },
  'agree-and-join-server-opt-in-3054-4090': {
    desktop: on('desktop/src/renderer/components/TermsOfService/TermsOfServiceComponent.tsx'),
    mobile: on('mobile/src/components/TermsOfService/TermsOfService.component.tsx'),
  },
  'captcha-3054-4052': {
    desktop: on('desktop/src/renderer/captcha.html'),
    mobile: on('mobile/src/components/Captcha/CaptchaModal.component.tsx'),
    divergence:
      'hCaptcha. Desktop loads it in captcha.html via preload.captcha.ts; the backend verifies in captcha.service.ts. Open bugs: #3428 reappearing captcha, #3368 no offline/timeout messaging.',
  },
  'home-add-members': {
    desktop: on('desktop/src/renderer/components/Channel/ChannelComponent.tsx'),
    mobile: on('mobile/src/components/Chat/Chat.component.tsx'),
    divergence: 'The design puts an Add members entry on the home screen; both apps put it under Settings.',
  },
  'add-members-options': {
    desktop: on('desktop/src/renderer/components/Settings/Tabs/Invite/Invite.component.tsx'),
    mobile: on('mobile/src/components/QRCode/QRCode.component.tsx'),
  },
  'community-home': {
    desktop: on('desktop/src/renderer/components/Channel/ChannelComponent.tsx'),
    mobile: on('mobile/src/components/Chat/Chat.component.tsx'),
  },
  'recover-account-info': {
    desktop: on('desktop/src/renderer/components/Onboarding/RecoverAccountComponent.tsx'),
    mobile: on('mobile/src/components/RecoverAccount/RecoverAccount.component.tsx'),
    divergence:
      "The info screen and its two prototype routes (Link devices, Open invite link) only; there is no recovery mechanism. 'More options' leads nowhere in the design and is inert.",
  },
  'create-default': {
    desktop: on('desktop/src/renderer/components/CreateJoinCommunity/CreateCommunity/CreateCommunity.tsx'),
    mobile: on('mobile/src/components/CreateCommunity/CreateCommunity.component.tsx'),
    divergence: 'Design adds a community icon (upload / crop); neither app has one.',
  },
  'username-default': {
    desktop: on('desktop/src/renderer/components/CreateUsername/CreateUsernameComponent.tsx'),
    mobile: on('mobile/src/components/Registration/UsernameRegistration.component.tsx'),
  },
  'username-populated': {
    desktop: on('desktop/src/renderer/components/CreateUsername/CreateUsernameComponent.tsx'),
    mobile: on('mobile/src/components/Registration/UsernameRegistration.component.tsx'),
  },
  'link-devices': {
    desktop: pr('desktop/src/renderer/components/Settings/Tabs/LinkedDevices/LinkedDevices.component.tsx'),
    mobile: pr('mobile/src/screens/LinkedDeviceQRCode/LinkedDeviceQRCode.screen.tsx'),
    divergence:
      "#3400 vocabulary: DeviceLinkInvite, deviceLinkUrl, LinkedDevices; strings 'Generating device link…', 'Device link unavailable'. It lives under Settings, not onboarding.",
  },
  // Join from invite link + prototype (the join path after the link is pasted).
  'username-unpopulated': {
    desktop: on('desktop/src/renderer/components/CreateUsername/CreateUsernameComponent.tsx'),
    mobile: on('mobile/src/components/Registration/UsernameRegistration.component.tsx'),
    divergence:
      'Both apps use one username screen for the create and join paths; the design draws them differently — this one keeps the bar title "Choose a username" and its divider, the create-side frames hide the title.',
  },
  'username-populated-2811-2749': {
    desktop: on('desktop/src/renderer/components/CreateUsername/CreateUsernameComponent.tsx'),
    mobile: on('mobile/src/components/Registration/UsernameRegistration.component.tsx'),
  },
  'agree-and-join': {
    desktop: on('desktop/src/renderer/components/Onboarding/AgreeAndJoinCard.tsx'),
    mobile: on('mobile/src/components/AgreeAndJoin/AgreeAndJoin.component.tsx'),
    divergence:
      'The frame is one card, and two steps ask for consent through it, so the card is the shared shell and each step brings its own body: the terms step (desktop TermsOfServiceComponent, mobile TermsOfService) carries the policy copy, and the device-link step (desktop DeviceLinkConsent, mobile DeviceLinkConsent — the "use Quiet\'s server?" step in desktop join, desktop Link devices and the mobile paste flow) carries what contacting the named host exposes. The prototype wires consent after username, which is where mobile shows JoiningOptIn + TermsOfService today. The design names the server in the body (api.tryquiet.org) instead of in a heading.',
  },
  'globe-animation': {
    desktop: on('desktop/src/renderer/components/LoadingPanel/JoiningPanelComponent.tsx'),
    mobile: on('mobile/src/components/ConnectionProcess/ConnectionProcess.component.tsx'),
    divergence:
      'Both already render "Joining now!", the 300×4 bar and a ConnectionProcessInfo status line under it — the QSS variant keeps exactly that and drops the Tor paragraph and the "Learn more about Tor and Quiet" link both apps still show. Bar fill is teal #67BFD3 by decision; desktop uses lushSky and mobile’s base fill is #2196f3.',
  },
  'starting-quiet': {
    desktop: on('desktop/src/renderer/components/LoadingPanel/StartingPanelComponent.tsx'),
    mobile: on('mobile/src/components/Splash/Splash.component.tsx'),
    divergence:
      'App start, not joining. Desktop renders only the Quiet logo — the progress-bar and status styles are declared in StartingPanelComponent but never rendered; mobile shows the logo with "Starting backend" / "This can take some time" and no bar. The frame draws a bar, "Starting Quiet" and the status message "Connecting to Tor…".',
  },
}

/** Stages the apps have that the Figma flow does not draw — divergence in the other direction. */
export const IMPLEMENTATION_ONLY: Array<{ stage: string; desktop?: string; mobile?: string }> = [
  {
    stage: 'Terms of service',
    desktop: 'desktop/src/renderer/components/TermsOfService/TermsOfServiceComponent.tsx',
    mobile: 'mobile/src/components/TermsOfService/TermsOfService.component.tsx',
  },
  {
    stage: 'Username created / success',
    desktop: 'desktop/src/renderer/components/CreateUsername/UsernameCreated/UsernameCreated.tsx',
    mobile: 'mobile/src/components/Success/Success.component.tsx',
  },
]
