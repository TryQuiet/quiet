import React from 'react'

import { Typography, TypographyProps } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'

const useStyles = makeStyles(theme => ({
  link: {
    textDecoration: 'none',
    color: theme.palette.colors.linkBlue
  }
}))

export interface TextWithLinkProps {
  text: string
  tagPrefix?: string
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
  ...props
}) => {
  const classes = useStyles({})

  const format = (action: () => void, label: string) => {
    return (
      <a
        href='#'
        className={classes.link}
        onClick={e => {
          e.preventDefault()
          action()
        }}>
        {label}
      </a>
    )
  }

  var parts: Array<string | JSX.Element> = text.split(/(\s+)/)

  links.map(link => {
    for (var i = 1; i < parts.length; i++) {
      if (`${tagPrefix + link.tag}` === parts[i]) {
        parts[i] = format(link.action, link.label)
      }
    }
  })

  return (
    <Typography {...props}>
      {parts.map((e, index) => {
        return <span key={index}>{e}</span>
      })}
    </Typography>
  )
}

export default TextWithLink
