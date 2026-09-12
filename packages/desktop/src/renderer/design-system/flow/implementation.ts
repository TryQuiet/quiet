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
    desktop: none('app opens directly into the Join / Create modals'),
    mobile: none('app opens directly on the JoinCommunity screen'),
    divergence: 'The design has an entry screen with three routes; both apps skip it.',
  },
  'join-community': {
    desktop: on('desktop/src/renderer/components/CreateJoinCommunity/JoinCommunity/JoinCommunity.tsx'),
    mobile: on('mobile/src/components/JoinCommunity/JoinCommunity.component.tsx'),
    divergence:
      'Design is a three-way choice (invite link / QR code / recover account) — decided: adopt it. Both apps ship a single invite-link paste field.',
  },
  'open-invite-link': {
    desktop: on('desktop/src/renderer/components/CreateJoinCommunity/PerformCommunityActionComponent.tsx'),
    mobile: on('mobile/src/components/JoinCommunity/JoinCommunity.component.tsx'),
  },
  container: {
    desktop: on('desktop/src/renderer/components/CreateJoinCommunity/PerformCommunityActionComponent.tsx'),
    mobile: on('mobile/src/components/JoinCommunity/JoinCommunity.component.tsx'),
    divergence: 'This is the paste-a-link stage. Both apps implement it as their whole join screen; in the design it is one of three routes.',
  },
  'want-a-server': {
    desktop: on('desktop/src/renderer/components/ServerOffer/ServerOfferComponent.tsx'),
    mobile: on('mobile/src/components/ServerOffer/CreatingOffer/ServerOffer.component.tsx'),
    divergence: 'Design reaches this from Home → Add members, after the community exists; both apps show the offer during creation instead.',
  },
  'no-server': {
    desktop: none('declining is a button on the offer itself; there is no confirmation screen'),
    mobile: none('declining is a button on the offer itself; there is no confirmation screen'),
  },
  'choose-a-plan': { desktop: none('no plans or subscriptions exist'), mobile: none('no plans or subscriptions exist') },
  'agree-and-join-v-1-before-we-support-multiple-hosts': {
    desktop: on('desktop/src/renderer/components/TermsOfService/TermsOfServiceComponent.tsx'),
    mobile: on('mobile/src/components/ServerOffer/JoiningOptIn/JoiningOptIn.component.tsx'),
    divergence: 'Design: one Agree & Join screen reached from nowhere. Implementation: an opt-in drawer plus a separate Terms of Service screen, shown after username (mobile) / on join (desktop).',
  },
  'agree-and-join-server-opt-in-3054-4090': {
    desktop: on('desktop/src/renderer/components/TermsOfService/TermsOfServiceComponent.tsx'),
    mobile: on('mobile/src/components/TermsOfService/TermsOfService.component.tsx'),
  },
  'captcha-3054-4052': {
    desktop: on('desktop/src/renderer/captcha.html'),
    mobile: on('mobile/src/components/Captcha/CaptchaModal.component.tsx'),
    divergence: 'hCaptcha. Desktop loads it in captcha.html via preload.captcha.ts; the backend verifies in captcha.service.ts. Open bugs: #3428 reappearing captcha, #3368 no offline/timeout messaging.',
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
    desktop: none('no account-recovery flow'),
    mobile: none('no account-recovery flow'),
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
}

/** Stages the apps have that the Figma flow does not draw — divergence in the other direction. */
export const IMPLEMENTATION_ONLY: Array<{ stage: string; desktop?: string; mobile?: string }> = [
  {
    stage: 'Server offer (opt in to a Quiet server)',
    desktop: 'desktop/src/renderer/components/ServerOffer/ServerOfferComponent.tsx',
    mobile: 'mobile/src/components/ModalBottomDrawer/drawers/ServerOffer.drawer.tsx',
  },
  {
    stage: 'Terms of service',
    desktop: 'desktop/src/renderer/components/TermsOfService/TermsOfServiceComponent.tsx',
    mobile: 'mobile/src/components/TermsOfService/TermsOfService.component.tsx',
  },
  { stage: 'Connecting / loading', desktop: 'desktop/src/renderer/components/LoadingPanel/StartingPanelComponent.tsx', mobile: 'mobile/src/components/ConnectionProcess/ConnectionProcess.component.tsx' },
  { stage: 'Username created / success', desktop: 'desktop/src/renderer/components/CreateUsername/UsernameCreated/UsernameCreated.tsx', mobile: 'mobile/src/components/Success/Success.component.tsx' },
  { stage: 'Splash', mobile: 'mobile/src/components/Splash/Splash.component.tsx' },
]
