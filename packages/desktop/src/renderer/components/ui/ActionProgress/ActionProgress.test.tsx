import React from 'react'

import { renderComponent } from '../../../testUtils/renderComponent'
import { ActionProgress } from './ActionProgress'

describe('ActionProgress', () => {
  it('shows the status line under the bar', () => {
    const result = renderComponent(<ActionProgress status='Leaving community…' />)

    expect(result.getByTestId('actionProgressStatus').textContent).toBe('Leaving community…')
    expect(result.getByRole('progressbar')).toBeTruthy()
  })

  it('sweeps the fill when the action reports no phases', () => {
    const result = renderComponent(<ActionProgress status='Leaving community…' />)

    expect(result.getByRole('progressbar').getAttribute('aria-valuenow')).toBeNull()
    expect(result.getByTestId('actionProgressFill').getAttribute('data-indeterminate')).toBe('true')
  })

  it('fills to the value when the action reports phases', () => {
    const result = renderComponent(<ActionProgress status='Joining now!' value={0.5} />)

    expect(result.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('50')
    const fill = result.getByTestId('actionProgressFill')
    expect(fill.getAttribute('data-indeterminate')).toBe('false')
    expect(fill.style.width).toBe('50%')
  })

  it('clamps a value below zero', () => {
    const result = renderComponent(<ActionProgress status='Joining now!' value={-2} />)
    expect(result.getByTestId('actionProgressFill').style.width).toBe('0%')
  })

  it('clamps a value above one', () => {
    const result = renderComponent(<ActionProgress status='Joining now!' value={4} />)
    expect(result.getByTestId('actionProgressFill').style.width).toBe('100%')
  })

  it('hides the second line when there is none', () => {
    const result = renderComponent(<ActionProgress status='Leaving community…' />)
    expect(result.queryByTestId('actionProgressSecondary')).toBeNull()
  })

  it('shows the second line when there is one', () => {
    const result = renderComponent(
      <ActionProgress status='Joining now!' secondary='This can take a few minutes.' value={0.25} />
    )
    expect(result.getByTestId('actionProgressSecondary').textContent).toBe('This can take a few minutes.')
  })

  it('renders component', () => {
    const result = renderComponent(<ActionProgress status='Leaving community…' secondary='Additional info' />)
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="MuiGrid-root ActionProgressroot css-ar2mpm-MuiGrid-root"
            data-testid="actionProgress"
          >
            <div
              aria-valuemax="100"
              aria-valuemin="0"
              class="ActionProgresstrack"
              role="progressbar"
            >
              <div
                class="ActionProgressfill"
                data-indeterminate="true"
                data-testid="actionProgressFill"
              />
            </div>
            <p
              class="MuiTypography-root MuiTypography-body2 ActionProgressstatus css-1t82dwi-MuiTypography-root"
              data-testid="actionProgressStatus"
              role="status"
            >
              Leaving community…
            </p>
            <span
              class="MuiTypography-root MuiTypography-caption ActionProgresssecondary css-sb3pb0-MuiTypography-root"
              data-testid="actionProgressSecondary"
            >
              Additional info
            </span>
          </div>
        </div>
      </body>
    `)
  })
})
