/**
 * Onboarding copy that desktop and mobile both draw.
 *
 * Every string here is rendered by at least two of: the desktop renderer, the
 * mobile app, the design-system stories and the end-to-end selectors. Spelling
 * one of them in more than one place is how "Paste a link to Join" survived in
 * ~60 literals, so the screens, the stories, the jest assertions and the e2e
 * selectors all import from here and a copy change is a single edit.
 *
 * App copy is sentence case, which `onboardingCopy.test.ts` enforces. The
 * designer's Figma frames use their own casing; the files that transcribe a
 * frame (`design-system/figma/*.json`, `design-system/flow/*`, the
 * `OnboardingFlow` story names, ONBOARDING.md) quote the frame verbatim and so
 * deliberately keep their literals.
 */

/** Get started, the entry screen both apps open on. */
export const GET_STARTED_HEADING = 'Let’s get started...'

/** Join community: the three-way choice reached from Get started. */
export const JOIN_COMMUNITY_HEADING = 'Join community'

/** The three rows on Join community, and the headings their screens carry. */
export const JOIN_WITH_INVITE_LINK_HEADING = 'Join with invite link'
export const JOIN_WITH_QR_CODE_HEADING = 'Join with QR code'
export const RECOVER_ACCOUNT_HEADING = 'Recover account'

/** Open invite link: the explanatory step before the paste field. */
export const OPEN_INVITE_LINK_HEADING = 'Open invite link'

/** The paste step. The invite-link, QR-code and device-link flows all submit here. */
export const PASTE_LINK_HEADING = 'Paste a link to join'
export const PASTE_LINK_PLACEHOLDER = 'Link'

/** The scanner's fallback when the camera is denied or absent, and the Link devices row. */
export const PASTE_A_LINK_LABEL = 'Paste a link'
export const PASTE_LINK_LABEL = 'Paste link'

/** Link devices, reached from Get started and from Settings. */
export const LINK_DEVICES_HEADING = 'Link devices'
export const SCAN_QR_CODE_HEADING = 'Scan QR code'
export const SCAN_QR_CODE_INTRO =
  'Go to “Link devices” on the other device and display the QR code. Scan it to link devices.'

/** The create flow. */
export const CREATE_COMMUNITY_HEADING = 'Create a community'
export const CHOOSE_USERNAME_HEADING = 'Choose username'
