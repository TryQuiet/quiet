import React from 'react'

import each from 'jest-each'

import { renderComponent } from '../../../testUtils/renderComponent'
import { Tooltip } from './Tooltip'

describe('Tooltip', () => {
    const TooltipContent = () => <div>TooltipContent</div>
    it('renders component', () => {
        const result = renderComponent(
            <Tooltip title='test-title'>
                <TooltipContent />
            </Tooltip>
        )
        expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <span>
            <div>
              TooltipContent
            </div>
          </span>
        </div>
      </body>
    `)
    })

    it('renders component with optional props', () => {
        const result = renderComponent(
            <Tooltip title='test-title' interactive>
                <TooltipContent />
            </Tooltip>
        )
        expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <span>
            <div>
              TooltipContent
            </div>
          </span>
        </div>
      </body>
    `)
    })

    each(['bottom-start', 'bottom', 'bottom-end', 'top-start', 'top', 'top-end']).test(
        'renders component with correct arrow placement - %s',
        placement => {
            const result = renderComponent(
                <Tooltip title='test-title' placement={placement}>
                    <TooltipContent />
                </Tooltip>
            )
            expect(result.baseElement).toMatchSnapshot()
        }
    )
})
