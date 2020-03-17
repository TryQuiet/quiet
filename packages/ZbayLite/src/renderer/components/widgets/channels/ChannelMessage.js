import React, { useState } from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { shell } from 'electron'
import Immutable from 'immutable'
import Jdenticon from 'react-jdenticon'
import isImageUrl from 'is-image-url'
import reactStringReplace from 'react-string-replace'
import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import { withStyles } from '@material-ui/core/styles'
import { Button } from '@material-ui/core'

import { _DisplayableMessage } from '../../../zbay/messages'
import ChannelMessageActions from './ChannelMessageActions'
import BasicMessage from '../../../containers/widgets/channels/BasicMessage'
import Tooltip from '../../ui/Tooltip'
import imagePlacegolder from '../../../static/images/imagePlacegolder.svg'
import Icon from '../../ui/Icon'
import OpenlinkModal from '../../../containers/ui/OpenlinkModal'

const styles = theme => ({
  message: {
    marginTop: 14,
    whiteSpace: 'pre-line',
    wordBreak: 'break-word'
  },
  messageInput: {
    marginTop: -35,
    marginLeft: 46
  },
  imagePlaceholder: {
    marginLeft: 46,
    backgroundColor: theme.palette.colors.veryLightGray,
    height: 104,
    width: 112,
    borderRadius: 8,
    overflow: 'hidden',
    cursor: 'pointer'
  },
  button: {
    minWidth: 80,
    height: 24,
    fontSize: 11,
    lineHeight: '13px',
    textTransform: 'none',
    padding: 0,
    fontWeight: 'normal',
    color: theme.palette.colors.trueBlack,
    borderColor: theme.palette.colors.trueBlack
  },
  imagePlacegolderDiv: {
    marginTop: 20
  },
  buttonDiv: {
    marginBottom: 5
  },
  img: {
    maxWidth: 220,
    maxHeight: 300
  },
  imageDiv: {
    maxWidth: 220,
    maxHeight: 330,
    marginLeft: 50,
    borderRadius: 8,
    overflow: 'hidden',
    cursor: 'pointer'
  },
  imgName: {
    height: 30,
    fontSize: 12,
    letterSpacing: 0.4,
    lineHeight: '18px',
    backgroundColor: theme.palette.colors.veryLightGray,
    color: theme.palette.colors.black30,
    padding: '7px 16px'
  }
})
// highlight: {
//   color: theme.palette.colors.lushSky,
//   backgroundColor: theme.palette.colors.lushSky12,
//   padding: 5,
//   borderRadius: 4
// }
// TODO Create separate component for mentions
const checkLinking = (
  tags,
  users,
  onLinkedChannel,
  onLinkedUser,
  message,
  setImageUrl,
  openExternalLink,
  allowAll,
  whitelisted
) => {
  let parsedMessage = message
    .replace(String.fromCharCode(10), String.fromCharCode(160))
    .replace(/ /g, String.fromCharCode(160))
    .split(String.fromCharCode(160))

  for (const index in parsedMessage) {
    const part = parsedMessage[index]
    if (part.startsWith('https://') || part.startsWith('http://')) {
      parsedMessage[index] = (
        <a
          style={{
            color: '#67BFD3',
            textDecoration: 'none'
          }}
          key={index}
          onClick={e => {
            e.preventDefault()
            if (allowAll || whitelisted.contains(new URL(part).hostname)) {
              shell.openExternal(part)
              return
            }
            openExternalLink(part)
          }}
          href={``}
        >
          {part}
        </a>
      )
      if (isImageUrl(part)) {
        setImageUrl(part)
      }
    }
  }
  parsedMessage = reactStringReplace(parsedMessage, /#(\w+)/g, (match, i) => {
    if (!tags.get(match)) {
      return `#${match}`
    }
    return (
      <a
        style={{
          color: '#67BFD3',
          backgroundColor: '#EDF7FA',
          borderRadius: 4,
          textDecoration: 'none'
        }}
        key={match + i}
        onClick={e => {
          e.preventDefault()
          onLinkedChannel(tags.get(match))
        }}
        href={``}
      >
        #{match}
      </a>
    )
  })

  parsedMessage = reactStringReplace(parsedMessage, /@(\w+)/g, (match, i) => {
    if (!users.find(user => user.nickname === match)) {
      return `@${match}`
    }
    return (
      <Tooltip
        titleHTML={
          <Grid
            container
            alignItems='center'
            justify='center'
            style={{ marginBottom: -2, marginTop: -2 }}
          >
            <Grid
              item
              style={{
                marginRight: 9,
                width: 20,
                height: 20,
                borderRadius: 4,
                backgroundColor: '#FFF'
              }}
            >
              <div style={{ marginLeft: 1, marginTop: 1 }}>
                <Jdenticon size='18' value={match} />
              </div>
            </Grid>
            <Grid item>
              <span
                style={{
                  color: '#FFF',
                  fontSize: 12,
                  fontWeight: 500
                }}
              >
                {match}
              </span>
            </Grid>
          </Grid>
        }
        style={{ marginBottom: -5 }}
        placement='top'
        interactive
        onClick={e => {
          e.preventDefault()
          onLinkedUser(users.find(user => user.nickname === match))
        }}
      >
        <a
          style={{
            color: '#67BFD3',
            backgroundColor: '#EDF7FA',
            padding: 0,
            borderRadius: 4,
            textDecoration: 'none'
          }}
          key={match + i}
          onClick={e => {
            e.preventDefault()
            onLinkedUser(users.find(user => user.nickname === match))
          }}
          href={``}
        >
          @{match}
        </a>
      </Tooltip>
    )
  })
  const messageToDisplay = []
  for (const index in parsedMessage) {
    messageToDisplay.push(' ')
    messageToDisplay.push(parsedMessage[index])
  }
  return messageToDisplay
}
export const ChannelMessage = ({
  classes,
  message,
  onResend,
  publicChannels,
  onLinkedChannel,
  onLinkedUser,
  users,
  openExternalLink,
  allowAll,
  whitelisted,
  addToWhitelist,
  setWhitelistAll,
  autoload
}) => {
  const [showImage, setShowImage] = React.useState(false)
  const [imageUrl, setImageUrl] = React.useState(null)
  const [parsedMessage, setParsedMessage] = React.useState('')
  const [openModal, setOpenModal] = React.useState(false)
  const status = message.get('status', 'broadcasted')
  const messageData = message.get('message')
  const autoloadImage = imageUrl
    ? autoload.contains(new URL(imageUrl).hostname)
    : false
  React.useEffect(() => {
    setParsedMessage(
      checkLinking(
        publicChannels,
        users,
        onLinkedChannel,
        onLinkedUser,
        messageData,
        setImageUrl,
        openExternalLink,
        allowAll,
        whitelisted
      )
    )
  }, [messageData, whitelisted, allowAll])
  React.useEffect(() => {
    if (allowAll || whitelisted.contains(imageUrl)) {
      setShowImage(true)
    }
  }, [imageUrl])
  const [actionsOpen, setActionsOpen] = useState(false)
  return (
    <BasicMessage
      message={message}
      actionsOpen={actionsOpen}
      setActionsOpen={setActionsOpen}
    >
      <Grid className={classes.messageInput} item>
        <Typography variant='body2' className={classes.message}>
          {parsedMessage}
        </Typography>
        {status === 'failed' && (
          <ChannelMessageActions onResend={() => onResend(message)} />
        )}
      </Grid>
      {!showImage && imageUrl && !autoloadImage && (
        <Grid
          item
          container
          className={classes.imagePlaceholder}
          justify='center'
          spacing={0}
          onClick={() => {
            if (whitelisted.contains(new URL(imageUrl).hostname)) {
              setShowImage(true)
            } else {
              setOpenModal(true)
            }
          }}
        >
          <Grid item className={classes.imagePlacegolderDiv}>
            <Icon className={classes.imagePlacegolder} src={imagePlacegolder} />
          </Grid>
          <Grid item className={classes.buttonDiv}>
            <Button className={classes.button} variant='outlined'>
              Load image
            </Button>
          </Grid>
        </Grid>
      )}
      {((showImage && imageUrl) || autoloadImage) && (
        <Grid
          item
          container
          direction='column'
          onClick={() => {
            shell.openExternal(imageUrl)
          }}
          className={classes.imageDiv}
        >
          <img className={classes.img} src={imageUrl} alt='new' />
        </Grid>
      )}
      {imageUrl && (
        <OpenlinkModal
          open={openModal}
          handleClose={() => setOpenModal(false)}
          handleConfirm={() => setShowImage(true)}
          url={imageUrl}
          addToWhitelist={addToWhitelist}
          setWhitelistAll={setWhitelistAll}
          isImage
        />
      )}
    </BasicMessage>
  )
}

ChannelMessage.propTypes = {
  classes: PropTypes.object.isRequired,
  message: PropTypes.instanceOf(_DisplayableMessage).isRequired,
  publicChannels: PropTypes.instanceOf(Immutable.Map).isRequired,
  users: PropTypes.instanceOf(Immutable.Map).isRequired,
  whitelisted: PropTypes.instanceOf(Immutable.List).isRequired,
  autoload: PropTypes.instanceOf(Immutable.List).isRequired,
  onResend: PropTypes.func,
  onLinkedChannel: PropTypes.func.isRequired,
  onLinkedUser: PropTypes.func.isRequired,
  openExternalLink: PropTypes.func.isRequired,
  setWhitelistAll: PropTypes.func.isRequired,
  addToWhitelist: PropTypes.func.isRequired,
  allowAll: PropTypes.bool.isRequired
}
export default R.compose(React.memo, withStyles(styles))(ChannelMessage)
