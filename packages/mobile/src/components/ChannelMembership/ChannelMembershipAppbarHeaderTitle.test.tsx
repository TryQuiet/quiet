import React from 'react'
import { ChannelType } from '@quiet/types'

import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'
import { ChannelMembershipAppbarHeaderTitle } from './ChannelMembershipAppbarHeaderTitle.component'

describe('ChannelMembershipAppbarHeaderTitle', () => {
  // The glyph beside the channel name follows its privacy, not its kind (Figma
  // PVQ1Kjf6Cq8ng1czuVtvR8, 838:9190).
  const renderTitle = (channelType: ChannelType, channelIsPublic?: boolean, channelTitle = 'general') =>
    renderComponent(
      <ChannelMembershipAppbarHeaderTitle
        title={'Members'}
        channelTitle={channelTitle}
        channelType={channelType}
        channelIsPublic={channelIsPublic}
      />
    )

  it("gives a public channel the '#' glyph, not a padlock", () => {
    const { queryByTestId } = renderTitle(ChannelType.CHANNEL, true)

    expect(queryByTestId('channel-membership-public-icon')).not.toBeNull()
    expect(queryByTestId('channel-membership-private-icon')).toBeNull()
  })

  it('gives a private channel the padlock', () => {
    const { queryByTestId } = renderTitle(ChannelType.CHANNEL, false)

    expect(queryByTestId('channel-membership-private-icon')).not.toBeNull()
    expect(queryByTestId('channel-membership-public-icon')).toBeNull()
  })

  it('gives a DM neither glyph', () => {
    const { queryByTestId } = renderTitle(ChannelType.DM, false)

    expect(queryByTestId('channel-membership-private-icon')).toBeNull()
    expect(queryByTestId('channel-membership-public-icon')).toBeNull()
  })

  it('names the channel under the title', () => {
    const { queryByText } = renderTitle(ChannelType.CHANNEL, true)

    expect(queryByText('general')).not.toBeNull()
  })

  // A DM is named by its participants, and the screen below this bar lists those same people.
  it('does not name a DM under the title, where it would repeat the list below', () => {
    const { queryByText } = renderTitle(ChannelType.DM, false, 'denise, gordon')

    expect(queryByText('denise, gordon')).toBeNull()
  })
})
