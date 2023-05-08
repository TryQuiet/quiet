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
  blockquote: `${PREFIX}blockquote`,
  code: `${PREFIX}code`,
  pre: `${PREFIX}pre`,
  hr: `${PREFIX}hr`,
  link: `${PREFIX}link`,
  ol: `${PREFIX}list`,
  ul: `${PREFIX}ul`,
  tableHeaderCell: `${PREFIX}tableHeaderCell`,
  tableRowCell: `${PREFIX}tableRowCell`
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

  [`& .${classes.blockquote}`]: {
    lineHeight: '1em',
    whiteSpace: 'normal',
    marginInlineStart: 0,
    marginBlockStart: '.5em',
    marginBlockEnd: '.5em',
    paddingTop: '.5em',
    paddingBottom: '.5em',
    paddingLeft: '1em',
    borderLeft: 'solid',
    borderLeftWidth: '3px',
    borderColor: theme.palette.colors.lightGray,
    color: theme.palette.colors.lightGray
  },

  [`& .${classes.code}`]: {
    backgroundColor: theme.palette.colors.veryLightGray
  },

  [`& .${classes.pre}`]: {
    backgroundColor: theme.palette.colors.veryLightGray
  },

  [`& .${classes.hr}`]: {
    marginTop: '1em',
    marginBottom: '1em',
  },

  [`& .${classes.link}`]: {
    color: theme.palette.colors.lushSky,
    cursor: 'pointer',
    '&:hover': {
      textDecoration: 'underline'
    }
  },

  [`& .${classes.ol}`]: {
    paddingInlineStart: '15px',
    whiteSpace: 'normal'
  },

  [`& .${classes.ul}`]: {
    paddingInlineStart: '15px',
    whiteSpace: 'normal',
    listStyleType: 'disc'
  },

  [`& .${classes.tableHeaderCell}`]: {
    borderBottom: 'solid',
    borderBottomWidth: 1,
    borderColor: theme.palette.colors.veryLightGray,
    textAlign: 'center'
  },

  [`& .${classes.tableRowCell}`]: {
    textAlign: 'center'
  },
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
          blockquote: ({ node, ...props }) => (
            <blockquote className={classNames({ [classes.blockquote]: true })} {...props} />
          ),
          code: ({ node, ...props }) => (
            <code className={classNames({ [classes.code]: true })} {...props} />
          ),
          pre: ({ node, ...props }) => (
            <pre className={classNames({ [classes.pre]: true })} {...props} />
          ),
          h1: React.Fragment,
          h2: React.Fragment,
          h3: React.Fragment,
          h4: React.Fragment,
          h5: React.Fragment,
          h6: React.Fragment,
          hr: ({ node, ...props }) => (
            <hr className={classNames({ [classes.hr]: true })} {...props} />
          ),
          img: ({ node, ...props }) => (
            <p>
              ![{props.alt}]({props.src})
            </p>
          ),
          p: React.Fragment,
          ol: ({ node, ...props }) => (
            <ol className={classNames({ [classes.ol]: true })} {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul className={classNames({ [classes.ul]: true })} {...props} />
          ),
          th: ({ node, ...props }) => (
            <th className={classNames({ [classes.tableHeaderCell]: props.isHeader })} {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className={classNames({ [classes.tableRowCell]: true })} {...props} />
          ),
        }}
      />
    </StyledTypography>
  )
}
