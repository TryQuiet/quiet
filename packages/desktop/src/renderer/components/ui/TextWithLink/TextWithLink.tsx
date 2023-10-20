import React from 'react'

import { styled } from '@mui/material/styles'

import { Typography, TypographyProps } from '@mui/material'

const PREFIX = 'TextWithLink'

const classes = {
  link: `${PREFIX}link`,
}

const StyledTypography = styled(Typography)(({ theme }) => ({
  [`& .${classes.link}`]: {
    textDecoration: 'none',
    color: theme.palette.colors.linkBlue,
  },
}))

export interface TextWithLinkProps {
  text: string
  tagPrefix?: string
  testIdPrefix?: string
  links: [
    {
      tag: string
      label: string
      action: () => void
    }
  ]
}

export const TextWithLink: React.FC<TextWithLinkProps & TypographyProps> = ({
  text,
  tagPrefix = '%',
  links,
  testIdPrefix = '',
  ...props
}) => {
  const format = (action: () => void, label: string) => {
    return (
      <a
        href='#'
        className={classes.link}
        onClick={e => {
          e.preventDefault()
          action()
        }}
        data-testid={`${testIdPrefix}Link`}
      >
        {label}
      </a>
    )
  }

  const parts: Array<string | JSX.Element> = text.split(/(\s+)/)

  links.map(link => {
    for (let i = 1; i < parts.length; i++) {
      if (`${tagPrefix + link.tag}` === parts[i]) {
        parts[i] = format(link.action, link.label)
      }
    }
  })

  return (
    <StyledTypography {...props}>
      {parts.map((e, index) => {
        return <span key={index}>{e}</span>
      })}
    </StyledTypography>
  )
}

export default TextWithLink
