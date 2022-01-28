import React from 'react'
import { renderComponent } from '../../../testUtils/renderComponent'

import { ConfirmModal } from './ConfirmModal'

describe('ConfirmModal', () => {
  it('renders component', () => {
    const result = renderComponent(
      <ConfirmModal
        handleAction={() => {}}
        handleClose={() => {}}
        title='testtitle'
        actionName='testactionname'
        open
        cancelName={''}
      />
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body
        style="overflow: hidden; padding-right: 0px;"
      >
        <div
          aria-hidden="true"
        />
        <div
          class="MuiDialog-root"
          role="presentation"
          style="position: fixed; z-index: 1300; right: 0px; bottom: 0px; top: 0px; left: 0px;"
        >
          <div
            aria-hidden="true"
            class="MuiBackdrop-root"
            style="opacity: 1; webkit-transition: opacity 225ms cubic-bezier(0.4, 0, 0.2, 1) 0ms; transition: opacity 225ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;"
          />
          <div
            data-test="sentinelStart"
            tabindex="0"
          />
          <div
            class="MuiDialog-container MuiDialog-scrollPaper"
            role="none presentation"
            style="opacity: 1; webkit-transition: opacity 225ms cubic-bezier(0.4, 0, 0.2, 1) 0ms; transition: opacity 225ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;"
            tabindex="-1"
          >
            <div
              class="MuiPaper-root MuiPaper-elevation24 MuiDialog-paper MuiDialog-paperScrollPaper MuiDialog-paperWidthSm MuiPaper-rounded"
              role="dialog"
            >
              <div
                class="MuiDialogContent-root makeStyles-dialogContent-3"
              >
                <p
                  class="MuiTypography-root makeStyles-info-2 MuiTypography-body2"
                >
                  testtitle
                </p>
              </div>
              <div
                class="MuiDialogActions-root makeStyles-dialogActions-6 MuiDialogActions-spacing"
              >
                <div
                  class="MuiGrid-root MuiGrid-container MuiGrid-justify-xs-flex-end"
                >
                  <div
                    class="MuiGrid-root makeStyles-buttonNo-4 MuiGrid-item MuiGrid-grid-xs-true"
                  >
                    <p
                      class="MuiTypography-root makeStyles-typography-7 MuiTypography-body1"
                    />
                  </div>
                  <div
                    class="MuiGrid-root makeStyles-buttonYes-5 MuiGrid-item MuiGrid-grid-xs-true"
                  >
                    <p
                      class="MuiTypography-root makeStyles-textYes-8 MuiTypography-body1"
                    >
                      testactionname
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div
            data-test="sentinelEnd"
            tabindex="0"
          />
        </div>
      </body>
    `)
  })
})
