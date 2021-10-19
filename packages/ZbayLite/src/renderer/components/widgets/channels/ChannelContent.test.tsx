import React from 'react'
import { Provider } from 'react-redux'

import { ChannelContent } from './ChannelContent'
import { CHANNEL_TYPE } from '../../pages/ChannelTypes'
import { renderComponent } from '../../../testUtils/renderComponent'
import { Mentions } from '../../../store/handlers/mentions'
import store from '../../../store'
import { DateTime } from 'luxon'
import { now } from '../../../testUtils'

describe('ChannelContent', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(DateTime, 'utc').mockImplementationOnce(() => now)
  })

  it('renders component', () => {
    const mentions = { channelId: [new Mentions({ nickname: '', timeStamp: 100000 })] }
    const result = renderComponent(
      <Provider store={store}>
        <ChannelContent
          channelType={CHANNEL_TYPE.NORMAL}
          measureRef={React.createRef()}
          contentRect={''}
          mentions={mentions}
          removeMention={jest.fn()}
          contactId={''}
          tab={1}
        />
      </Provider>
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="MuiGrid-root makeStyles-fullHeight-1 MuiGrid-container MuiGrid-item MuiGrid-direction-xs-column"
          >
            <div
              class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-true"
            >
              <div
                class="rc-scrollbars-container"
                style="position: relative; overflow: hidden; width: 100%; height: 100%;"
              >
                <div
                  class="rc-scrollbars-view"
                  style="position: absolute; top: 0px; left: 0px; right: 0px; bottom: 0px; overflow: scroll; margin-right: 0px; margin-bottom: 0px;"
                >
                  <ul
                    class="MuiList-root makeStyles-list-106"
                    id="messages-scroll"
                  />
                </div>
                <div
                  class="rc-scrollbars-track rc-scrollbars-track-h"
                  style="position: absolute; right: 2px; bottom: 2px; z-index: 100; border-radius: 3px; left: 2px; height: 6px; display: none;"
                >
                  <div
                    class="rc-scrollbars-thumb rc-scrollbars-thumb-h"
                    style="position: relative; display: block; height: 100%; cursor: pointer; border-radius: inherit; background-color: rgba(0, 0, 0, 0.2);"
                  />
                </div>
                <div
                  class="rc-scrollbars-track rc-scrollbars-track-v"
                  style="position: absolute; right: 2px; bottom: 2px; z-index: 100; border-radius: 3px; top: 2px; width: 6px; display: none;"
                >
                  <div
                    class="rc-scrollbars-thumb rc-scrollbars-thumb-v"
                    style="position: relative; display: block; height: 100%; cursor: pointer; border-radius: inherit; background-color: rgba(0, 0, 0, 0.2);"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </body>
    `)
  })
})
