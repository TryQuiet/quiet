import { ImageSourcePropType } from 'react-native'

// ---------- ICONS ----------
const arrow_left = require('./icons/png/arrow_left.png')
const arrow_right_short = require('./icons/png/arrow_right_short.png')
const check_circle_blank = require('./icons/png/check_circle_blank.png')
const check_circle_green = require('./icons/png/check_circle_green.png')
const dots = require('./icons/png/dots.png')
const paperclip_gray = require('./icons/png/paperclip_gray.png')
const file_document = require('./icons/png/file_document.png')
const icon_check_white = require('./icons/png/icon_check_white.png')
const icon_close = require('./icons/png/icon_close.png')
const icon_send = require('./icons/png/icon_send.png')
const icon_send_disabled = require('./icons/png/icon_send_disabled.png')
const icon_warning = require('./icons/png/icon_warning.png')
const quiet_icon = require('./icons/png/quiet_icon.png')
const quiet_icon_round = require('./icons/png/quiet_icon_round.png')
const update_graphics = require('./icons/png/update_graphics.png')
const username_registered = require('./icons/png/username_registered.png')
const exclamationMark = require('./icons/png/exclamationMark.png')
const join_community = require('./icons/png/join-community.png')
const server_icon = require('./icons/svg/server-icon.tsx')

export const icons = {
  arrow_left,
  arrow_right_short,
  check_circle_blank,
  check_circle_green,
  dots,
  paperclip_gray,
  file_document,
  icon_check_white,
  icon_close,
  icon_send,
  icon_send_disabled,
  icon_warning,
  quiet_icon,
  quiet_icon_round,
  update_graphics,
  username_registered,
  exclamationMark,
  join_community,
  server_icon,
}

export type IconName = keyof typeof icons
export function getIcon(name: IconName): ImageSourcePropType {
  return icons[name]
}

// ---------- FONTS ----------
export const fonts = {
  rubik: {
    black: 'Rubik-Black',
    blackItalic: 'Rubik-BlackItalic',
    bold: 'Rubik-Bold',
    boldItalic: 'Rubik-BoldItalic',
    extraBold: 'Rubik-ExtraBold',
    extraBoldItalic: 'Rubik-ExtraBoldItalic',
    italic: 'Rubik-Italic',
    light: 'Rubik-Light',
    lightItalic: 'Rubik-LightItalic',
    medium: 'Rubik-Medium',
    mediumItalic: 'Rubik-MediumItalic',
    regular: 'Rubik-Regular',
    semiBold: 'Rubik-SemiBold',
    semiBoldItalic: 'Rubik-SemiBoldItalic',
  },
}

// ---------- STORYBOOK ----------
export const storybookImages = {}
