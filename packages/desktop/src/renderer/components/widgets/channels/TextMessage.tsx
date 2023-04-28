import { Typography, styled } from '@mui/material'
import classNames from 'classnames'
import React, { ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import theme from '../../../theme'

const PREFIX = 'TextMessage'

const classes = {
  message: `${PREFIX}message`,
  pending: `${PREFIX}pending`,
  link: `${PREFIX}link`,
  list: `${PREFIX}list`
}

const StyledTypography = styled(Typography)(() => ({
  [`&.${classes.message}`]: {
    fontSize: '0.855rem',
    whiteSpace: 'pre-line',
    lineHeight: '21px',
    overflowWrap: 'anywhere'
  },

  [`&.${classes.pending}`]: {
    color: theme.palette.colors.lightGray
  },

  [`& .${classes.link}`]: {
    color: theme.palette.colors.lushSky,
    cursor: 'pointer',
    '&:hover': {
      textDecoration: 'underline'
    }
  },

  [`& .${classes.list}`]: {
    whiteSpace: 'normal'
  }
})) as typeof Typography

export interface TextMessageComponentProps {
  message: string
  messageId: string
  pending: boolean
  openUrl: (url: string) => void
}

export const TextMessageComponent: React.FC<TextMessageComponentProps> = ({
  message,
  messageId,
  pending,
  openUrl
}) => {
  return (
    <StyledTypography
      component={'span' as any}
      className={classNames({
        [classes.message]: true,
        [classes.pending]: pending
      })}
      data-testid={`messagesGroupContent-${messageId}`}>
      <ReactMarkdown
        remarkPlugins={[[remarkGfm, { singleTilde: false }]]}
        children={message}
        components={{
          a: ({ node, ...props }) => (
            <a
              onClick={e => {
                e.preventDefault()
                openUrl(props.href)
              }}
              className={classNames({ [classes.link]: true })}
              {...props}
            />
          ),
          h1: React.Fragment,
          h2: React.Fragment,
          h3: React.Fragment,
          h4: React.Fragment,
          h5: React.Fragment,
          h6: React.Fragment,
          ol: ({ node, ...props }) => (
            <ol className={classNames({ [classes.list]: true })} {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul className={classNames({ [classes.list]: true })} {...props} />
          ),
          p: React.Fragment
        }}
      />
    </StyledTypography>
  )
}
