import React from 'react'
import theme from '../../../theme'
import { ThemeProvider } from '@mui/material/styles'
import { renderComponent } from '../../../testUtils/renderComponent'
import UserLabel from './UserLabel.component'
import { payloadDuplicated, payloadUnregistered, UserLabelType } from './UserLabel.types'

describe('UserLabel', () => {
    it('duplicate', () => {
        const result = renderComponent(
            <ThemeProvider theme={theme}>
                <UserLabel
                    duplicatedUsernameModalHandleOpen={() => payloadDuplicated}
                    unregisteredUsernameModalHandleOpen={() => payloadUnregistered}
                    username={'johnny'}
                    type={UserLabelType.DUPLICATE}
                />
            </ThemeProvider>
        )
        expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="MuiGrid-root css-9ezr5u-MuiGrid-root"
          >
            <div
              class="MuiGrid-root MuiGrid-container MuiGrid-item UserLabel-wrapper UserLabel-wrapperRed css-1gb55do-MuiGrid-root"
            >
              <img
                class="UserLabel-image"
                src="test-file-stub"
              />
              <span
                class="MuiTypography-root MuiTypography-caption UserLabel-wrapper UserLabel-textWhite css-1d4bzk2-MuiTypography-root"
              >
                Duplicate
              </span>
            </div>
          </div>
        </div>
      </body>
    `)
    })
    it('unregistered', () => {
        const result = renderComponent(
            <ThemeProvider theme={theme}>
                <UserLabel
                    duplicatedUsernameModalHandleOpen={() => payloadDuplicated}
                    unregisteredUsernameModalHandleOpen={() => payloadUnregistered}
                    username={'johnny'}
                    type={UserLabelType.UNREGISTERED}
                />
            </ThemeProvider>
        )
        expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="MuiGrid-root css-9ezr5u-MuiGrid-root"
          >
            <div
              class="MuiGrid-root MuiGrid-container MuiGrid-item UserLabel-wrapper UserLabel-wrapperGray css-1gb55do-MuiGrid-root"
            >
              <span
                class="MuiTypography-root MuiTypography-caption UserLabel-wrapper UserLabel-textBlack css-1d4bzk2-MuiTypography-root"
              >
                Unregistered
              </span>
            </div>
          </div>
        </div>
      </body>
    `)
    })
})
