// Row and caret glyphs exported from the Figma prototype (Get started /
// Join community / Link devices frames of f6Nr5b5wtvk6Xoh1HJZ8Dd), not redrawn.
import caretRight from '../../static/images/onboarding/caret-right.svg'
import info from '../../static/images/onboarding/info.svg'
import inviteLink from '../../static/images/onboarding/invite-link.svg'
import linkDevices from '../../static/images/onboarding/link-devices.svg'
import personAdd from '../../static/images/onboarding/person-add.svg'
import plus from '../../static/images/onboarding/plus.svg'
import qrCode from '../../static/images/onboarding/qr-code.svg'
import qrDisplay from '../../static/images/onboarding/qr-display.svg'
import qrScan from '../../static/images/onboarding/qr-scan.svg'
import monster from '../../static/images/onboarding/monster@2x.png'
import heartChat from '../../static/images/onboarding/heart-chat@2x.png'
import circleLogo from '../../static/images/onboarding/get-started-circle-logo.svg'

export const onboardingIcons = {
  caretRight,
  info,
  inviteLink,
  linkDevices,
  personAdd,
  plus,
  qrCode,
  qrDisplay,
  qrScan,
}

/** The "Monster" illustration from the Open invite link frame, exported at 2x (120px box). */
export const monsterIllustration = monster

/**
 * The heart-chat graphic the Join community frame (2811:2562) opens with —
 * instance I2815:2504;6181:27547 (Graphic--heart-chat), exported at 2x, drawn at
 * its frame size. The same export the mobile screen uses.
 */
export const heartChatIllustration = heartChat
export const HEART_CHAT_SIZE = { width: 219, height: 160 } as const

/**
 * The Quiet mark as the Get started frame (2811:2550) draws it: a 120px circle
 * (#521C74, r=60) holding the library's Logo-icon (4309:16912) — exported from
 * Figma, not redrawn.
 */
export const logoIcon = circleLogo
export const LOGO_SIZE = 120
