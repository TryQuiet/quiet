import React from 'react'
import Svg, { Circle, Path } from 'react-native-svg'
import { defaultTheme } from '../../../styles/themes/default.theme'

// Row and caret glyphs exported from the Figma prototype (Get started / Join
// community / Link devices frames of f6Nr5b5wtvk6Xoh1HJZ8Dd), paths verbatim.

export interface OnboardingIconProps {
  size?: number
  color?: string
}

export const PersonAddIcon: React.FC<OnboardingIconProps> = ({
  size = 24,
  color = defaultTheme.palette.typography.main,
}) => (
  <Svg width={size} height={size} viewBox='0 0 24 24' fill='none'>
    <Circle cx='9' cy='8' r='3' stroke={color} strokeWidth='2' />
    <Path d='M19 7C19 9.34315 19 13 19 13' stroke={color} strokeWidth='1.5' strokeLinecap='round' />
    <Path d='M22 10C19.6569 10 16 10 16 10' stroke={color} strokeWidth='1.5' strokeLinecap='round' />
    <Path
      d='M15.6475 17.5419C14.5814 14.8101 11.3221 13.7344 9 13.7344C6.67222 13.7344 3.40255 14.7726 2.34467 17.54C1.95026 18.5718 2.89485 19.5 3.99942 19.5H9H14.0002C15.1048 19.5 16.0491 18.5709 15.6475 17.5419Z'
      stroke={color}
      strokeWidth='2'
    />
  </Svg>
)

export const PlusIcon: React.FC<OnboardingIconProps> = ({
  size = 24,
  color = defaultTheme.palette.typography.main,
}) => (
  <Svg width={size} height={size} viewBox='0 0 24 24' fill='none'>
    <Path
      fillRule='evenodd'
      clipRule='evenodd'
      d='M20.9025 12.9972H12.997V20.9026H11.003V12.9972H3.09753V11.0031H11.003V3.09766L12.997 3.09766V11.0031H20.9025V12.9972Z'
      fill={color}
    />
  </Svg>
)

export const LinkDevicesIcon: React.FC<OnboardingIconProps> = ({
  size = 24,
  color = defaultTheme.palette.typography.main,
}) => (
  <Svg width={size} height={size} viewBox='0 0 24 24' fill='none'>
    <Path
      d='M2 20V17H4V6C4 5.45 4.196 4.97933 4.588 4.588C4.97933 4.196 5.45 4 6 4H21V6H6V17H12V20H2ZM15 20C14.7167 20 14.4793 19.904 14.288 19.712C14.096 19.5207 14 19.2833 14 19V9C14 8.71667 14.096 8.479 14.288 8.287C14.4793 8.09567 14.7167 8 15 8H21C21.2833 8 21.5207 8.09567 21.712 8.287C21.904 8.479 22 8.71667 22 9V19C22 19.2833 21.904 19.5207 21.712 19.712C21.5207 19.904 21.2833 20 21 20H15ZM16 17H20V10H16V17Z'
      fill={color}
    />
  </Svg>
)

export const CaretRightIcon: React.FC<OnboardingIconProps> = ({
  size = 24,
  color = defaultTheme.palette.typography.main,
}) => (
  <Svg width={size} height={size} viewBox='0 0 24 24' fill='none'>
    <Path
      d='M7.93933 6.70718L9.35355 5.29297L16.0607 12.0001L9.35354 18.7072L7.93933 17.293L13.2322 12.0001L7.93933 6.70718Z'
      fill={color}
    />
  </Svg>
)

export const InviteLinkIcon: React.FC<OnboardingIconProps> = ({
  size = 24,
  color = defaultTheme.palette.typography.main,
}) => (
  <Svg width={size} height={size} viewBox='0 0 24 24' fill='none'>
    <Path
      d='M11 17H7C5.61667 17 4.4375 16.5125 3.4625 15.5375C2.4875 14.5625 2 13.3833 2 12C2 10.6167 2.4875 9.4375 3.4625 8.4625C4.4375 7.4875 5.61667 7 7 7H11V9H7C6.16667 9 5.45833 9.29167 4.875 9.875C4.29167 10.4583 4 11.1667 4 12C4 12.8333 4.29167 13.5417 4.875 14.125C5.45833 14.7083 6.16667 15 7 15H11V17ZM8 13V11H16V13H8ZM13 17V15H17C17.8333 15 18.5417 14.7083 19.125 14.125C19.7083 13.5417 20 12.8333 20 12C20 11.1667 19.7083 10.4583 19.125 9.875C18.5417 9.29167 17.8333 9 17 9H13V7H17C18.3833 7 19.5625 7.4875 20.5375 8.4625C21.5125 9.4375 22 10.6167 22 12C22 13.3833 21.5125 14.5625 20.5375 15.5375C19.5625 16.5125 18.3833 17 17 17H13Z'
      fill={color}
    />
  </Svg>
)

export const QrCodeIcon: React.FC<OnboardingIconProps> = ({
  size = 24,
  color = defaultTheme.palette.typography.main,
}) => (
  <Svg width={size} height={size} viewBox='0 0 24 24' fill='none'>
    <Path d='M3 11H11V3H3V11ZM5 5H9V9H5V5Z' fill={color} />
    <Path d='M3 21H11V13H3V21ZM5 15H9V19H5V15Z' fill={color} />
    <Path d='M13 3V11H21V3H13ZM19 9H15V5H19V9Z' fill={color} />
    <Path d='M21 19H19V21H21V19Z' fill={color} />
    <Path d='M15 13H13V15H15V13Z' fill={color} />
    <Path d='M17 15H15V17H17V15Z' fill={color} />
    <Path d='M15 17H13V19H15V17Z' fill={color} />
    <Path d='M17 19H15V21H17V19Z' fill={color} />
    <Path d='M19 17H17V19H19V17Z' fill={color} />
    <Path d='M19 13H17V15H19V13Z' fill={color} />
    <Path d='M21 15H19V17H21V15Z' fill={color} />
  </Svg>
)

export const InfoIcon: React.FC<OnboardingIconProps> = ({
  size = 24,
  color = defaultTheme.palette.typography.main,
}) => (
  <Svg width={size} height={size} viewBox='0 0 24 24' fill='none'>
    <Path
      d='M22 19H16V15H13.32C12.18 17.42 9.72 19 7 19C3.14 19 0 15.86 0 12C0 8.14 3.14 5 7 5C9.72 5 12.17 6.58 13.32 9H24V15H22V19ZM18 17H20V13H22V11H11.94L11.71 10.33C11.01 8.34 9.11 7 7 7C4.24 7 2 9.24 2 12C2 14.76 4.24 17 7 17C9.11 17 11.01 15.66 11.71 13.67L11.94 13H18V17ZM7 15C5.35 15 4 13.65 4 12C4 10.35 5.35 9 7 9C8.65 9 10 10.35 10 12C10 13.65 8.65 15 7 15ZM7 11C6.45 11 6 11.45 6 12C6 12.55 6.45 13 7 13C7.55 13 8 12.55 8 12C8 11.45 7.55 11 7 11Z'
      fill={color}
    />
  </Svg>
)

export const QrDisplayIcon: React.FC<OnboardingIconProps> = ({
  size = 24,
  color = defaultTheme.palette.typography.main,
}) => (
  <Svg width={size} height={size} viewBox='0 0 24 24' fill='none'>
    <Path
      d='M15.75 4.875L15.75 7.875C15.75 8.08211 15.9179 8.25 16.125 8.25L19.125 8.25C19.3321 8.25 19.5 8.08211 19.5 7.875L19.5 4.875C19.5 4.66789 19.3321 4.5 19.125 4.5L16.125 4.5C15.9179 4.5 15.75 4.66789 15.75 4.875Z'
      fill={color}
    />
    <Path
      d='M12.75 8.625L12.75 10.875C12.75 11.0821 12.9179 11.25 13.125 11.25L15.375 11.25C15.5821 11.25 15.75 11.0821 15.75 10.875L15.75 8.625C15.75 8.41789 15.5821 8.25 15.375 8.25L13.125 8.25C12.9179 8.25 12.75 8.41789 12.75 8.625Z'
      fill={color}
    />
    <Path
      d='M19.5 1.875L19.5 4.125C19.5 4.33211 19.6679 4.5 19.875 4.5L22.125 4.5C22.3321 4.5 22.5 4.33211 22.5 4.125L22.5 1.875C22.5 1.66789 22.3321 1.5 22.125 1.5L19.875 1.5C19.6679 1.5 19.5 1.66789 19.5 1.875Z'
      fill={color}
    />
    <Path
      d='M12.75 1.875L12.75 3.375C12.75 3.58211 12.9179 3.75 13.125 3.75L14.625 3.75C14.8321 3.75 15 3.58211 15 3.375L15 1.875C15 1.66789 14.8321 1.5 14.625 1.5L13.125 1.5C12.9179 1.5 12.75 1.66789 12.75 1.875Z'
      fill={color}
    />
    <Path
      d='M20.25 9.375L20.25 10.875C20.25 11.0821 20.4179 11.25 20.625 11.25L22.125 11.25C22.3321 11.25 22.5 11.0821 22.5 10.875L22.5 9.375C22.5 9.16789 22.3321 9 22.125 9L20.625 9C20.4179 9 20.25 9.16789 20.25 9.375Z'
      fill={color}
    />
    <Path
      d='M4.5 4.875L4.5 7.875C4.5 8.08211 4.66789 8.25 4.875 8.25L7.875 8.25C8.08211 8.25 8.25 8.08211 8.25 7.875L8.25 4.875C8.25 4.66789 8.08211 4.5 7.875 4.5L4.875 4.5C4.66789 4.5 4.5 4.66789 4.5 4.875Z'
      fill={color}
    />
    <Path
      d='M2.25 3L2.25 9.75C2.25 10.1642 2.58579 10.5 3 10.5L9.75 10.5C10.1642 10.5 10.5 10.1642 10.5 9.75L10.5 3C10.5 2.58579 10.1642 2.25 9.75 2.25L3 2.25C2.58579 2.25 2.25 2.58579 2.25 3Z'
      stroke={color}
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <Path
      d='M4.5 16.125L4.5 19.125C4.5 19.3321 4.66789 19.5 4.875 19.5L7.875 19.5C8.08211 19.5 8.25 19.3321 8.25 19.125L8.25 16.125C8.25 15.9179 8.08211 15.75 7.875 15.75L4.875 15.75C4.66789 15.75 4.5 15.9179 4.5 16.125Z'
      fill={color}
    />
    <Path
      d='M2.25 14.25L2.25 21C2.25 21.4142 2.58579 21.75 3 21.75L9.75 21.75C10.1642 21.75 10.5 21.4142 10.5 21L10.5 14.25C10.5 13.8358 10.1642 13.5 9.75 13.5L3 13.5C2.58579 13.5 2.25 13.8358 2.25 14.25Z'
      stroke={color}
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <Path
      d='M15.75 16.125L15.75 19.125C15.75 19.3321 15.9179 19.5 16.125 19.5L19.125 19.5C19.3321 19.5 19.5 19.3321 19.5 19.125L19.5 16.125C19.5 15.9179 19.3321 15.75 19.125 15.75L16.125 15.75C15.9179 15.75 15.75 15.9179 15.75 16.125Z'
      fill={color}
    />
    <Path
      d='M13.5 14.25L13.5 21C13.5 21.4142 13.8358 21.75 14.25 21.75L21 21.75C21.4142 21.75 21.75 21.4142 21.75 21L21.75 14.25C21.75 13.8358 21.4142 13.5 21 13.5L14.25 13.5C13.8358 13.5 13.5 13.8358 13.5 14.25Z'
      stroke={color}
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </Svg>
)

export const QrScanIcon: React.FC<OnboardingIconProps> = ({
  size = 24,
  color = defaultTheme.palette.typography.main,
}) => (
  <Svg width={size} height={size} viewBox='0 0 24 24' fill='none'>
    <Path
      d='M12 17.5C13.25 17.5 14.3125 17.0625 15.1875 16.1875C16.0625 15.3125 16.5 14.25 16.5 13C16.5 11.75 16.0625 10.6875 15.1875 9.8125C14.3125 8.9375 13.25 8.5 12 8.5C10.75 8.5 9.6875 8.9375 8.8125 9.8125C7.9375 10.6875 7.5 11.75 7.5 13C7.5 14.25 7.9375 15.3125 8.8125 16.1875C9.6875 17.0625 10.75 17.5 12 17.5ZM12 15.5C11.3 15.5 10.7083 15.2583 10.225 14.775C9.74167 14.2917 9.5 13.7 9.5 13C9.5 12.3 9.74167 11.7083 10.225 11.225C10.7083 10.7417 11.3 10.5 12 10.5C12.7 10.5 13.2917 10.7417 13.775 11.225C14.2583 11.7083 14.5 12.3 14.5 13C14.5 13.7 14.2583 14.2917 13.775 14.775C13.2917 15.2583 12.7 15.5 12 15.5ZM4 21C3.45 21 2.97917 20.8042 2.5875 20.4125C2.19583 20.0208 2 19.55 2 19V7C2 6.45 2.19583 5.97917 2.5875 5.5875C2.97917 5.19583 3.45 5 4 5H7.15L9 3H15L16.85 5H20C20.55 5 21.0208 5.19583 21.4125 5.5875C21.8042 5.97917 22 6.45 22 7V19C22 19.55 21.8042 20.0208 21.4125 20.4125C21.0208 20.8042 20.55 21 20 21H4ZM4 19H20V7H15.95L14.125 5H9.875L8.05 7H4V19Z'
      fill={color}
    />
  </Svg>
)
