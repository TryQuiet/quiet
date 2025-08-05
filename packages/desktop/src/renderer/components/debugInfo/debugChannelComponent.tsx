import React from 'react'
import { useSelector } from 'react-redux'
import { styled } from '@mui/material/styles'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Paper from '@mui/material/Paper'
import { messages, publicChannels } from '@quiet/state-manager'

const PREFIX = 'DebugChannel'

const classes = {
  root: `${PREFIX}root`,
  section: `${PREFIX}section`,
  table: `${PREFIX}table`,
  th: `${PREFIX}th`,
  td: `${PREFIX}td`,
  json: `${PREFIX}json`,
}

const StyledGrid = styled(Grid)(({ theme }) => ({
  [`& .${classes.root}`]: {
    padding: 24,
    background: theme.palette.background.paper,
    borderRadius: 12,
    maxWidth: '100%',
    margin: '16px',
    boxShadow: theme.shadows[2],
    overflowY: 'auto',
    maxHeight: '100vh',
  },
  [`& .${classes.section}`]: {
    marginBottom: 24,
  },
  [`& .${classes.table}`]: {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: 16,
    tableLayout: 'fixed',
  },
  [`& .${classes.th}`]: {
    textAlign: 'left',
    padding: '6px 8px',
    color: theme.palette.text.secondary,
    fontWeight: 600,
    fontSize: 14,
    background: theme.palette.action.hover,
    wordBreak: 'break-word',
    whiteSpace: 'normal',
    overflowWrap: 'anywhere',
  },
  [`& .${classes.td}`]: {
    padding: '6px 8px',
    fontSize: 13,
    color: theme.palette.text.primary,
    borderBottom: `1px solid ${theme.palette.divider}`,
    wordBreak: 'break-word',
    whiteSpace: 'normal',
    overflowWrap: 'anywhere',
  },
  [`& .${classes.json}`]: {
    background: theme.palette.background.default,
    color: theme.palette.text.primary,
    padding: 12,
    borderRadius: 6,
    fontSize: 13,
    marginTop: 8,
    overflowX: 'auto',
    fontFamily: 'monospace',
    maxHeight: 300,
    overflowY: 'auto',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
  },
}))

// Selectors from publicChannels.selectors.ts relevant to Channel.tsx message display
const channelSelectors = publicChannels.selectors

export const DebugChannelComponent: React.FC = () => {
  // Get current channel id
  const currentChannelId = useSelector(channelSelectors.currentChannelId)
  // Channel message display selectors
  const currentChannelName = useSelector(channelSelectors.currentChannelName)
  const currentChannel = useSelector(channelSelectors.currentChannel)
  const currentChannelMessages = useSelector(channelSelectors.currentChannelMessages)
  const sortedCurrentChannelMessages = useSelector(channelSelectors.sortedCurrentChannelMessages)
  const displayableCurrentChannelMessages = useSelector(channelSelectors.displayableCurrentChannelMessages)
  const newestCurrentChannelMessage = useSelector(channelSelectors.newestCurrentChannelMessage)
  const currentChannelMessagesCount = useSelector(channelSelectors.currentChannelMessagesCount)
  const currentChannelMessagesMergedBySender = useSelector(channelSelectors.currentChannelMessagesMergedBySender)
  const currentChannelLastDisplayedMessage = useSelector(channelSelectors.currentChannelLastDisplayedMessage)

  // Selectors from messages.selectors.ts, filtered by currentChannel
  const publicChannelsMessagesBase = useSelector(messages.selectors.publicChannelsMessagesBase)
  const currentPublicChannelMessagesBase = useSelector(messages.selectors.currentPublicChannelMessagesBase)
  const currentPublicChannelMessagesEntities = useSelector(messages.selectors.currentPublicChannelMessagesEntities)
  const currentPublicChannelMessagesEntries = useSelector(messages.selectors.currentPublicChannelMessagesEntries)
  const validCurrentPublicChannelMessagesEntries = useSelector(
    messages.selectors.validCurrentPublicChannelMessagesEntries
  )
  const sortedCurrentPublicChannelMessagesEntries = useSelector(
    messages.selectors.sortedCurrentPublicChannelMessagesEntries
  )
  const messagesVerificationStatus = useSelector(messages.selectors.messagesVerificationStatus)
  const messagesSendingStatus = useSelector(messages.selectors.messagesSendingStatus)
  // For missingChannelMessages and missingChannelFiles, need to pass channelId
  // For demo, use empty array for ids
  // Use missingChannelMessages and missingChannelFiles directly
  const missingMessagesSelector = React.useMemo(
    () => (currentChannelId ? messages.selectors.missingChannelMessages([], currentChannelId) : () => []),
    [currentChannelId]
  )
  const missingFilesSelector = React.useMemo(
    () => (currentChannelId ? messages.selectors.missingChannelFiles(currentChannelId) : () => []),
    [currentChannelId]
  )
  const missingChannelMessagesArr = useSelector(missingMessagesSelector)
  const missingChannelFilesArr = useSelector(missingFilesSelector)

  // Compose debug info object
  const debugInfo = {
    currentChannelId,
    publicChannelsMessagesBase: currentChannelId ? publicChannelsMessagesBase?.[currentChannelId] : undefined,
    currentPublicChannelMessagesBase,
    currentPublicChannelMessagesEntities,
    currentPublicChannelMessagesEntries,
    validCurrentPublicChannelMessagesEntries,
    sortedCurrentPublicChannelMessagesEntries,
    messagesVerificationStatus: Object.fromEntries(
      Object.entries(messagesVerificationStatus || {}).filter(([id]) => {
        return currentPublicChannelMessagesEntities?.[id]
      })
    ),
    messagesSendingStatus: Object.fromEntries(
      Object.entries(messagesSendingStatus || {}).filter(([id]) => {
        return currentPublicChannelMessagesEntities?.[id]
      })
    ),
    missingChannelMessages: missingChannelMessagesArr,
    missingChannelFiles: missingChannelFilesArr,
  }

  return (
    <StyledGrid container direction='column' className={classes.root}>
      <Grid item className={classes.section}>
        <Typography variant='h5' gutterBottom>
          Channel Debug Information
        </Typography>
        <Divider sx={{ mb: 2 }} />
      </Grid>
      <Grid item className={classes.section}>
        <Typography variant='h6' gutterBottom>
          Channel Message Display Debug
        </Typography>
        <table className={classes.table}>
          <tbody>
            <tr>
              <th className={classes.th}>Current Channel ID</th>
              <td className={classes.td}>{String(currentChannelId)}</td>
            </tr>
            <tr>
              <th className={classes.th}>Current Channel Name</th>
              <td className={classes.td}>{String(currentChannelName)}</td>
            </tr>
            <tr>
              <th className={classes.th}>Messages Count</th>
              <td className={classes.td}>{String(currentChannelMessagesCount)}</td>
            </tr>
            <tr>
              <th className={classes.th}>Newest Message</th>
              <td className={classes.td}>{JSON.stringify(newestCurrentChannelMessage)}</td>
            </tr>
            <tr>
              <th className={classes.th}>Last Displayed Message</th>
              <td className={classes.td}>{JSON.stringify(currentChannelLastDisplayedMessage)}</td>
            </tr>
          </tbody>
        </table>
        <details open>
          <summary style={{ cursor: 'pointer', color: '#1976d2', fontWeight: 500, fontSize: 18 }}>
            Displayable Current Channel Messages
          </summary>
          <Paper elevation={0} sx={{ background: 'none', boxShadow: 'none' }}>
            <pre className={classes.json}>{JSON.stringify(displayableCurrentChannelMessages, null, 2)}</pre>
          </Paper>
        </details>
        <details>
          <summary style={{ cursor: 'pointer', color: '#1976d2', fontWeight: 500, fontSize: 16 }}>
            Current Channel Messages Merged By Sender
          </summary>
          <pre className={classes.json}>{JSON.stringify(currentChannelMessagesMergedBySender, null, 2)}</pre>
        </details>
        <details>
          <summary style={{ cursor: 'pointer', color: '#1976d2', fontWeight: 500, fontSize: 16 }}>
            Sorted Current Channel Messages
          </summary>
          <pre className={classes.json}>{JSON.stringify(sortedCurrentChannelMessages, null, 2)}</pre>
        </details>
      </Grid>
      <Grid item className={classes.section}>
        <details open>
          <summary style={{ cursor: 'pointer', color: '#1976d2', fontWeight: 500, fontSize: 18 }}>
            Channel Messages Entities
          </summary>
          <Paper elevation={0} sx={{ background: 'none', boxShadow: 'none' }}>
            <pre className={classes.json}>{JSON.stringify(currentPublicChannelMessagesEntities, null, 2)}</pre>
          </Paper>
        </details>
      </Grid>
      <Grid item className={classes.section}>
        <details>
          <summary style={{ cursor: 'pointer', color: '#1976d2', fontWeight: 500, fontSize: 16 }}>Raw JSON</summary>
          <pre className={classes.json}>{JSON.stringify(debugInfo, null, 2)}</pre>
        </details>
      </Grid>
    </StyledGrid>
  )
}

export default DebugChannelComponent
