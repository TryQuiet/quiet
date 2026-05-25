import React, { memo } from 'react'
import { createSvgIcon, SvgIconProps } from '@mui/material'
import inlineSvg from 'react-inlinesvg'

export interface LockIconProps extends SvgIconProps {
  testID?: string
}

const LockIcon: React.FC<LockIconProps> = memo(function LockIcon(props) {
  const LockComponent = createSvgIcon(
    inlineSvg({
      src: `<svg
          width='24'
          height='24'
          viewBox='0 0 24 24'
          fill=${props.fill ?? 'none'}
        >
          <mask id='a' fill='#fff'>
            <path d='M5.5 11.5a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1z' />
          </mask>
          <path
            stroke='currentColor'
            strokeWidth='4'
            d='M5.5 11.5a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1z'
            mask='url(#a)'
          />
          <path
            fill='currentColor'
            fillRule='evenodd'
            strokeWidth='4'
            d='M7.5 10.5h2V7a2.5 2.5 0 0 1 5 0v3.5h2V7a4.5 4.5 0 1 0-9 0z'
            clipRule='evenodd'
          />
        </svg>`,
    }) as React.ReactElement,
    'Lock'
  )
  return <LockComponent {...props} />
})

export default LockIcon
