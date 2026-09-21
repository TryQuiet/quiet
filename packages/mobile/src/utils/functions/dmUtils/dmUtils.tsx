export const MAX_DM_TITLE_MEMBER_NAMES = 2 // truncate DM names to a specific amount (e.g. 'bob, sue, alice' would become 'bob, sue and 1 more')

export const generateTruncatedDmTitle = (channelName: string, maxNumNames = MAX_DM_TITLE_MEMBER_NAMES): string => {
  // A DM's displayedName is derived from member profiles, so it can still be missing for the first
  // render right after the conversation is created. Returning '' keeps the screen rendering until
  // the name resolves; throwing here white-screened the whole chat view.
  if (!channelName) return ''
  const memberNames = channelName.split(', ')
  const truncatedDmChannelName =
    memberNames.length <= maxNumNames
      ? channelName
      : `${memberNames.slice(0, 2).join(', ')} and ${memberNames.length - maxNumNames} more`
  return truncatedDmChannelName
}
