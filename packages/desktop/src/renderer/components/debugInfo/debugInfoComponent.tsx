import React from 'react'
import {
  network,
  users,
  identity,
  communities,
  publicChannels,
  messages,
  errors,
  connection,
  settings,
  files,
} from '@quiet/state-manager'
import { useSelector } from 'react-redux'
import { styled } from '@mui/material/styles'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Paper from '@mui/material/Paper'
import {
  DownloadStatus,
  DownloadState,
  PublicChannel,
  Dictionary,
  ChannelMessage,
  Community,
  NetworkDataPayload,
  NetworkStats,
} from '@quiet/types'

const PREFIX = 'DebugInfo'

const classes = {
  root: `${PREFIX}root`,
  section: `${PREFIX}section`,
  table: `${PREFIX}table`,
  th: `${PREFIX}th`,
  td: `${PREFIX}td`,
  json: `${PREFIX}json`,
  summary: `${PREFIX}summary`,
  summarySmall: `${PREFIX}summarySmall`,
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
}))

export const DebugInfoComponent: React.FC = () => {
  // --- Network ---
  const connectedPeers = useSelector(network.selectors.connectedPeers)
  const initializedCommunities = useSelector(network.selectors.initializedCommunities)
  const loadingPanelType = useSelector(network.selectors.loadingPanelType)
  const isCommunityInitialized = useSelector(network.selectors.isCurrentCommunityInitialized)

  // --- Users ---
  const myUserProfile = useSelector(users.selectors.myUserProfile)
  const userProfiles = useSelector(users.selectors.userProfiles)
  const userProfile = useSelector(users.selectors.myUserProfile)
  const allUsers = useSelector(users.selectors.allUsers)

  // --- Identity ---
  const currentIdentity = useSelector(identity.selectors.currentIdentity)
  const allIdentities = useSelector(identity.selectors.selectEntities)
  const joinedCommunities = useSelector(identity.selectors.joinedCommunities)
  const username = myUserProfile?.nickname || ''
  const usernameTaken = useSelector(identity.selectors.usernameTaken)

  // --- Communities ---
  const communitiesList = useSelector(communities.selectors.selectCommunities)
  const currentCommunity = useSelector(communities.selectors.currentCommunity)
  const invitationCodes = useSelector(communities.selectors.invitationCodes)
  const isOwner = useSelector(communities.selectors.isOwner)

  // --- Public Channels ---
  const channels = useSelector(publicChannels.selectors.publicChannels)
  const currentChannelId = useSelector(publicChannels.selectors.currentChannelId)
  const subscribedChannels = useSelector(publicChannels.selectors.subscribedChannels)
  const pendingGeneralChannelRecreation = useSelector(publicChannels.selectors.pendingGeneralChannelRecreation)
  const channelsStatus = useSelector(publicChannels.selectors.channelsStatus)

  // --- Messages ---
  const messagesSendingStatus = useSelector(messages.selectors.messagesSendingStatus)
  const messagesVerificationStatus = useSelector(messages.selectors.messagesVerificationStatus)

  // --- Connection ---
  const peerStats = useSelector(connection.selectors.peerStats)
  const lastConnectedTime = useSelector(connection.selectors.lastConnectedTime)
  const torBootstrapProcess = useSelector(connection.selectors.torBootstrapProcess)
  const isTorInitialized = useSelector(connection.selectors.isTorInitialized)
  const connectionProcess = useSelector(connection.selectors.connectionProcess)
  const peerList = useSelector(connection.selectors.peerList)
  const longLivedInvite = useSelector(connection.selectors.longLivedInvite)

  // --- Settings ---
  const notificationsOption = useSelector(settings.selectors.getNotificationsOption)
  const notificationsSound = useSelector(settings.selectors.getNotificationsSound)

  // --- Files ---
  const downloadStatuses = useSelector(files.selectors.downloadStatuses)

  // --- Debug Info Object ---
  const debugInfo = {
    network: { connectedPeers, initializedCommunities, loadingPanelType, isCommunityInitialized },
    users: { userProfile, userProfiles, allUsers },
    identity: { currentIdentity, allIdentities, joinedCommunities, username, usernameTaken },
    communities: { communitiesList, currentCommunity, invitationCodes, isOwner },
    publicChannels: {
      channels,
      currentChannelId,
      subscribedChannels,
      pendingGeneralChannelRecreation,
      channelsStatus,
    },
    messages: { messagesSendingStatus, messagesVerificationStatus },
    connection: {
      lastConnectedTime,
      torBootstrapProcess,
      isTorInitialized,
      connectionProcess,
      peerList,
      longLivedInvite,
    },
    settings: { notificationsOption, notificationsSound },
    files: { downloadStatuses },
  }

  return (
    <StyledGrid container direction='column' className={classes.root}>
      <Grid item className={classes.section}>
        <Typography variant='h4' gutterBottom>
          Debug Information
        </Typography>
        <Divider sx={{ mb: 2 }} />
      </Grid>
      <Grid item className={classes.section}>
        <Typography variant='h6' gutterBottom>
          Summary
        </Typography>
        <table className={classes.table}>
          <colgroup>
            <col style={{ width: '45%' }} />
            <col style={{ width: '55%' }} />
          </colgroup>
          <tbody>
            <tr>
              <th className={classes.th}>Connected Peers</th>
              <td className={classes.td}>{Array.isArray(connectedPeers) ? connectedPeers.length : 0}</td>
            </tr>
            <tr>
              <th className={classes.th}>Current User</th>
              <td className={classes.td}>
                {userProfile?.nickname} ({userProfile?.userId})
              </td>
            </tr>
            <tr>
              <th className={classes.th}>Current Community</th>
              <td className={classes.td}>{currentCommunity?.name || 'N/A'}</td>
            </tr>
            <tr>
              <th className={classes.th}>Identity</th>
              <td className={classes.td}>{currentIdentity?.userId || 'N/A'}</td>
            </tr>
            <tr>
              <th className={classes.th}>Community Initialized</th>
              <td className={classes.td}>{isCommunityInitialized ? 'Yes' : 'No'}</td>
            </tr>
          </tbody>
        </table>
      </Grid>
      {/* --- User Profiles Section --- */}
      <Grid item className={classes.section}>
        <details open>
          <summary className={classes.summary}>User Profiles</summary>
          <Paper elevation={0} sx={{ background: 'none', boxShadow: 'none' }}>
            <table className={classes.table}>
              <thead>
                <tr>
                  <th className={classes.th}>Nickname</th>
                  <th className={classes.th}>User ID</th>
                  <th className={classes.th}>Peer ID</th>
                  <th className={classes.th}>Onion Address</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(userProfiles).map(profile => (
                  <tr key={profile.userId}>
                    <td className={classes.td}>{profile.nickname}</td>
                    <td className={classes.td} style={{ fontSize: 12, color: '#bdbdbd' }}>
                      {profile.userId}
                    </td>
                    <td className={classes.td}>{profile.userData?.peerId || '-'}</td>
                    <td className={classes.td}>{profile.userData?.onionAddress || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Paper>
        </details>
      </Grid>
      {/* --- Communities Section --- */}
      <Grid item className={classes.section}>
        <details open>
          <summary className={classes.summary}>Communities</summary>
          <Paper elevation={0} sx={{ background: 'none', boxShadow: 'none' }}>
            <table className={classes.table}>
              <thead>
                <tr>
                  <th className={classes.th}>Name</th>
                  <th className={classes.th}>ID</th>
                  <th className={classes.th}>Owner</th>
                </tr>
              </thead>
              <tbody>
                {communitiesList?.map((community: Community) => (
                  <tr key={community.id}>
                    <td className={classes.td}>{community.name}</td>
                    <td className={classes.td} style={{ fontSize: 12, color: '#bdbdbd' }}>
                      {community.id}
                    </td>
                    <td className={classes.td}>{community.ownership || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Paper>
        </details>
      </Grid>
      {/* --- Connection Section --- */}
      <Grid item className={classes.section}>
        <details open>
          <summary className={classes.summary}>Peer Stats</summary>
          <table className={classes.table}>
            <tbody>
              <tr>
                <th className={classes.th}>Last Connected Time</th>
                <td className={classes.td}>
                  {lastConnectedTime
                    ? new Date(
                        (lastConnectedTime ?? 0) < 1_000_000_000_000 ? lastConnectedTime * 1000 : lastConnectedTime
                      ).toLocaleString()
                    : '-'}
                </td>
              </tr>
              <tr>
                <th className={classes.th}>Tor Bootstrap</th>
                <td className={classes.td}>{torBootstrapProcess}</td>
              </tr>
              <tr>
                <th className={classes.th}>Tor Initialized</th>
                <td className={classes.td}>{isTorInitialized ? 'Yes' : 'No'}</td>
              </tr>
              <tr>
                <th className={classes.th}>Connection Process</th>
                <td className={classes.td}>{connectionProcess?.text || '-'}</td>
              </tr>
              <tr>
                <th className={classes.th}>Peer List</th>
                <td className={classes.td}>{peerList?.length || 0}</td>
              </tr>
              <tr>
                <th className={classes.th}>Long Lived Invite</th>
                <td className={classes.td}>{longLivedInvite ? JSON.stringify(longLivedInvite) : '-'}</td>
              </tr>
            </tbody>
          </table>
        </details>
      </Grid>
      {/* --- Peer Stats Section --- */}
      <Grid item className={classes.section}>
        <details open>
          <summary className={classes.summary}>Peer Stats Table</summary>
          <Paper elevation={0} sx={{ background: 'none', boxShadow: 'none' }}>
            <table className={classes.table}>
              <thead>
                <tr>
                  <th className={classes.th}>Peer ID</th>
                  <th className={classes.th}>Address</th>
                  <th className={classes.th}>Last Seen</th>
                  <th className={classes.th}>Connection Time (s)</th>
                </tr>
              </thead>
              <tbody>
                {peerStats?.map((peer: NetworkStats) => (
                  <tr key={peer.peerId}>
                    <td className={classes.td}>{peer.peerId}</td>
                    <td className={classes.td}>{peer.address || '-'}</td>
                    <td className={classes.td}>
                      {new Date(
                        (peer.lastSeen ?? 0) < 1_000_000_000_000 ? peer.lastSeen * 1000 : peer.lastSeen
                      ).toLocaleString() || '-'}
                    </td>
                    <td className={classes.td}>{peer.connectionTime || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Paper>
        </details>
      </Grid>
      {/* --- Public Channels Section --- */}
      <Grid item className={classes.section}>
        <details open>
          <summary className={classes.summary}>Public Channels</summary>
          <Paper elevation={0} sx={{ background: 'none', boxShadow: 'none' }}>
            <table className={classes.table}>
              <thead>
                <tr>
                  <th className={classes.th}>Name</th>
                  <th className={classes.th}>ID</th>
                  <th className={classes.th}>Owner</th>
                  <th className={classes.th}>Subscribed</th>
                  <th className={classes.th}>Unread</th>
                  <th className={classes.th}>Last&nbsp;Message</th>
                </tr>
              </thead>
              <tbody>
                {channels?.map(channel => {
                  const isSubscribed = subscribedChannels?.includes?.(channel.id)
                  const status = channelsStatus?.[channel.id]
                  const lastMessageTime = status?.newestMessage?.createdAt
                    ? new Date(status.newestMessage.createdAt).toLocaleString()
                    : '-'

                  return (
                    <tr key={channel.id}>
                      <td className={classes.td}>{channel.name}</td>
                      <td className={classes.td} style={{ fontSize: 12, color: '#bdbdbd' }}>
                        {channel.id}
                      </td>
                      <td className={classes.td}>{channel.owner || '-'}</td>
                      <td className={classes.td}>{isSubscribed ? 'Yes' : 'No'}</td>
                      <td className={classes.td}>{status?.unread ? 'Yes' : 'No'}</td>
                      <td className={classes.td}>{lastMessageTime}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </Paper>
        </details>
      </Grid>
      {/* --- Settings Section --- */}
      <Grid item className={classes.section}>
        <details open>
          <summary className={classes.summary}>Settings</summary>
          <table className={classes.table}>
            <tbody>
              <tr>
                <th className={classes.th}>Notifications Option</th>
                <td className={classes.td}>{notificationsOption}</td>
              </tr>
              <tr>
                <th className={classes.th}>Notifications Sound</th>
                <td className={classes.td}>{notificationsSound}</td>
              </tr>
            </tbody>
          </table>
        </details>
      </Grid>
      {/* --- Files Section --- */}
      <Grid item className={classes.section}>
        <details open>
          <summary className={classes.summary}>File Downloads</summary>
          <Paper elevation={0} sx={{ background: 'none', boxShadow: 'none' }}>
            <table className={classes.table}>
              <thead>
                <tr>
                  <th className={classes.th}>CID</th>
                  <th className={classes.th}>Status</th>
                  <th className={classes.th}>Progress</th>
                </tr>
              </thead>
              <tbody>
                {downloadStatuses &&
                  Object.values(downloadStatuses).map((file: DownloadStatus | undefined) =>
                    file ? (
                      <tr key={file.cid}>
                        <td className={classes.td}>{file.cid}</td>
                        <td className={classes.td}>{file.downloadState}</td>
                        <td className={classes.td}>
                          {file.downloadProgress != null ? `${JSON.stringify(file.downloadProgress, null, 2)}` : '-'}
                        </td>
                      </tr>
                    ) : null
                  )}
              </tbody>
            </table>
          </Paper>
        </details>
      </Grid>
      {/* --- Raw JSON Section --- */}
      <Grid item className={classes.section}>
        <details>
          <summary className={classes.summarySmall}>Raw JSON</summary>
          <pre className={classes.json}>{JSON.stringify(debugInfo, null, 2)}</pre>
        </details>
      </Grid>
    </StyledGrid>
  )
}
