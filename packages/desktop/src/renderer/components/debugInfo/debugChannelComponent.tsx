import React from 'react'
import { useSelector } from 'react-redux'
import { styled } from '@mui/material/styles'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Paper from '@mui/material/Paper'
import { messages, publicChannels, files } from '@quiet/state-manager'
import { DownloadStatus } from '@quiet/types'

const PREFIX = 'DebugChannel'

const classes = {
  root: `${PREFIX}root`,
  section: `${PREFIX}section`,
  table: `${PREFIX}table`,
  th: `${PREFIX}th`,
  td: `${PREFIX}td`,
  json: `${PREFIX}json`,
  summary: `${PREFIX}summary`,
  summarySmall: `${PREFIX}summarySmall`,
  code: `${PREFIX}code`,
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
  [`& .${classes.summary}`]: {
    cursor: 'pointer',
    color: theme.palette.primary.main,
    fontWeight: 500,
    fontSize: 18,
  },
  [`& .${classes.summarySmall}`]: {
    cursor: 'pointer',
    color: theme.palette.primary.main,
    fontWeight: 500,
    fontSize: 16,
  },
  [`& .${classes.code}`]: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: theme.palette.text.secondary,
    wordBreak: 'break-all',
  },
}))

// Selectors from publicChannels.selectors.ts relevant to Channel.tsx message display
const channelSelectors = publicChannels.selectors

// Collapsible JSON that only stringifies when opened
const CollapsibleJson: React.FC<{
  summary: string
  data: any | (() => any)
  small?: boolean
  defaultOpen?: boolean
}> = ({ summary, data, small = false, defaultOpen = false }) => {
  const [open, setOpen] = React.useState(defaultOpen)
  const json = React.useMemo(() => {
    if (!open) return ''
    const value = typeof data === 'function' ? (data as any)() : data
    try {
      return JSON.stringify(value, null, 2)
    } catch (e) {
      return String(value)
    }
  }, [open, data])

  return (
    <details open={open} onToggle={e => setOpen((e.target as HTMLDetailsElement).open)}>
      <summary className={small ? classes.summarySmall : classes.summary}>{summary}</summary>
      {open ? <pre className={classes.json}>{json}</pre> : null}
    </details>
  )
}

export const DebugChannelComponent: React.FC = () => {
  // Get current channel id
  const currentChannelId = useSelector(channelSelectors.currentChannelId)
  // Channel message display selectors
  const currentChannelName = useSelector(channelSelectors.currentChannelName)
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
  const downloadStatuses = useSelector(files.selectors.downloadStatuses)
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

  const { verifiedCount, unverifiedMessageIds } = React.useMemo(() => {
    const idsInChannel = new Set(Object.keys(currentPublicChannelMessagesEntities || {}))
    let verified = 0
    const unverified: string[] = []
    for (const [id, status] of Object.entries(messagesVerificationStatus || {})) {
      if (!idsInChannel.has(id)) continue
      if ((status as any)?.isVerified) verified += 1
      else unverified.push(id)
    }
    return { verifiedCount: verified, unverifiedMessageIds: unverified }
  }, [messagesVerificationStatus, currentPublicChannelMessagesEntities])

  const unverifiedOrUnknownCount = Math.max((currentChannelMessagesCount || 0) - verifiedCount, 0)

  return (
    <StyledGrid container direction='column' className={classes.root}>
      <Grid item className={classes.section}>
        <Typography variant='h4' gutterBottom>
          Channel Debug Information
        </Typography>
        <Divider sx={{ mb: 2 }} />
      </Grid>
      <Grid item className={classes.section}>
        <Typography variant='h6' gutterBottom>
          Channel Message Display Debug
        </Typography>
        <table className={classes.table}>
          <colgroup>
            <col style={{ width: '45%' }} />
            <col style={{ width: '55%' }} />
          </colgroup>
          <tbody>
            <tr>
              <th className={classes.th}>Current Channel ID</th>
              <td className={classes.td}>
                <span className={classes.code}>{String(currentChannelId)}</span>
              </td>
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
              <th className={classes.th}>Verified Messages</th>
              <td className={classes.td}>{String(verifiedCount)}</td>
            </tr>
            <tr>
              <th className={classes.th}>Unverified / Unknown</th>
              <td className={classes.td}>{String(unverifiedOrUnknownCount)}</td>
            </tr>
            <tr>
              <th className={classes.th}>Newest Message</th>
              <td className={classes.td}>
                <CollapsibleJson summary='View JSON' data={newestCurrentChannelMessage} small />
              </td>
            </tr>
            <tr>
              <th className={classes.th}>Last Displayed Message</th>
              <td className={classes.td}>
                <CollapsibleJson summary='View JSON' data={currentChannelLastDisplayedMessage} small />
              </td>
            </tr>
          </tbody>
        </table>
        <CollapsibleJson summary='Displayable Current Channel Messages' data={displayableCurrentChannelMessages} />
        <CollapsibleJson
          summary='Current Channel Messages Merged By Sender'
          data={currentChannelMessagesMergedBySender}
          small
        />
      </Grid>
      <Grid item className={classes.section}>
        <CollapsibleJson summary='Channel Messages Entities' data={currentPublicChannelMessagesEntities} />
      </Grid>
      <Grid item className={classes.section}>
        <details open>
          <summary className={classes.summary}>Unverified Message IDs</summary>
          <Paper elevation={0} sx={{ background: 'none', boxShadow: 'none' }}>
            <table className={classes.table}>
              <colgroup>
                <col style={{ width: '100%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th className={classes.th}>Message ID</th>
                </tr>
              </thead>
              <tbody>
                {unverifiedMessageIds && unverifiedMessageIds.length > 0 ? (
                  unverifiedMessageIds.map(id => (
                    <tr key={id}>
                      <td className={classes.td}>
                        <span className={classes.code}>{id}</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className={classes.td}>—</td>
                  </tr>
                )}
              </tbody>
            </table>
          </Paper>
        </details>
      </Grid>
      <Grid item className={classes.section}>
        <details open>
          <summary className={classes.summary}>File Downloads</summary>
          <Paper elevation={0} sx={{ background: 'none', boxShadow: 'none' }}>
            <table className={classes.table}>
              <colgroup>
                <col style={{ width: '45%' }} />
                <col style={{ width: '30%' }} />
                <col style={{ width: '25%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th className={classes.th}>CID</th>
                  <th className={classes.th}>Status</th>
                  <th className={classes.th}>Progress</th>
                </tr>
              </thead>
              <tbody>
                {downloadStatuses && Object.values(downloadStatuses).length > 0 ? (
                  Object.values(downloadStatuses)
                    .filter((file): file is DownloadStatus => !!file)
                    .map(file => (
                      <tr key={file.cid}>
                        <td className={classes.td}>
                          <span className={classes.code}>{file.cid}</span>
                        </td>
                        <td className={classes.td}>{String(file.downloadState ?? '-')}</td>
                        <td className={classes.td}>{JSON.stringify(file.downloadProgress, null, 2) ?? '-'}</td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td className={classes.td}>—</td>
                    <td className={classes.td}>—</td>
                    <td className={classes.td}>—</td>
                  </tr>
                )}
              </tbody>
            </table>
          </Paper>
        </details>
      </Grid>
      <Grid item className={classes.section}>
        <CollapsibleJson
          summary='Raw JSON'
          small
          data={() => ({
            currentChannelId,
            publicChannelsMessagesBase: currentChannelId ? publicChannelsMessagesBase?.[currentChannelId] : undefined,
            currentPublicChannelMessagesBase,
            currentPublicChannelMessagesEntities,
            currentPublicChannelMessagesEntries,
            validCurrentPublicChannelMessagesEntries,
            sortedCurrentPublicChannelMessagesEntries,
            messagesVerificationStatus: Object.fromEntries(
              Object.entries(messagesVerificationStatus || {}).filter(
                ([id]) => currentPublicChannelMessagesEntities?.[id]
              )
            ),
            messagesSendingStatus: Object.fromEntries(
              Object.entries(messagesSendingStatus || {}).filter(([id]) => currentPublicChannelMessagesEntities?.[id])
            ),
            missingChannelMessages: missingChannelMessagesArr,
            missingChannelFiles: missingChannelFilesArr,
          })}
        />
      </Grid>
    </StyledGrid>
  )
}

export default DebugChannelComponent
