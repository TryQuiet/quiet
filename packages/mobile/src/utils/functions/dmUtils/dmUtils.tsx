export const MAX_DM_TITLE_MEMBER_NAMES = 2 // truncate DM names to a specific amount (e.g. 'bob, sue, alice' would become 'bob, sue and 1 more')

export const generateTruncatedDmTitle = (channelName: string, maxNumNames = MAX_DM_TITLE_MEMBER_NAMES): string => {
  const memberNames = channelName.split(', ')
  const truncatedDmChannelName =
    memberNames.length <= maxNumNames
      ? channelName
      : `${memberNames.slice(0, 2).join(', ')} and ${memberNames.length - maxNumNames} more`
  return truncatedDmChannelName
}
