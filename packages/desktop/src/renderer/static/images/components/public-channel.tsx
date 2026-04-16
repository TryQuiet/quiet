import React, { memo } from 'react'
import { createSvgIcon, SvgIconProps } from '@mui/material'
import inlineSvg from 'react-inlinesvg'

const PublicChannelIcon: React.FC<SvgIconProps> = memo(function LockIcon(props) {
  const PublicChannelComponent = createSvgIcon(
    inlineSvg({
      src: `<svg
        width='24'
        height='24'
        viewBox='0 0 24 24'
        fill='none'
      >
        <path d='M15.7318 4.875L12.8818 19.125' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
        <path d='M10.5355 4.875L7.68555 19.125' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
        <path d='M6.8252 8.58594H17.7502' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
        <path d='M5.875 15.4141H16.8' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
      </svg>`,
    }) as React.ReactElement,
    'PublicChannel'
  )
  return <PublicChannelComponent {...props} />
})

export default PublicChannelIcon
