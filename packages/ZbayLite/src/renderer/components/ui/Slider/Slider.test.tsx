import React from 'react'

import { renderComponent } from '../../../testUtils/renderComponent'
import { Slider } from './Slider'

describe('Slider', () => {
  it('renders component', () => {
    const result = renderComponent(
      <Slider
        value={23}
        handleOnChange={jest.fn()}
        title='this is a title of the slider'
        minLabel={''}
        maxLabel={''}
        min={0}
        max={0}
      />
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="MuiGrid-root MuiGrid-container MuiGrid-direction-xs-column MuiGrid-align-items-xs-center MuiGrid-justify-xs-center"
          >
            <span
              class="MuiTypography-root makeStyles-title-4 MuiTypography-caption"
            >
              this is a title of the slider
            </span>
            <div
              class="MuiGrid-root MuiGrid-item"
            >
              <div
                class="MuiGrid-root MuiGrid-container"
              >
                <div
                  class="MuiGrid-root MuiGrid-item"
                >
                  <p
                    class="MuiTypography-root makeStyles-label-3 MuiTypography-body2 MuiTypography-displayInline"
                  />
                </div>
                <div
                  class="MuiGrid-root makeStyles-sliderContainer-1 MuiGrid-item MuiGrid-grid-xs-true"
                >
                  <span
                    class="MuiSlider-root makeStyles-sliderRoot-2 MuiSlider-colorPrimary"
                  >
                    <span
                      class="MuiSlider-rail"
                    />
                    <span
                      class="MuiSlider-track makeStyles-track-6"
                    />
                    <input
                      type="hidden"
                      value="0"
                    />
                    <div
                      class="makeStyles-root-167"
                    />
                  </span>
                </div>
                <div
                  class="MuiGrid-root MuiGrid-item"
                >
                  <p
                    class="MuiTypography-root makeStyles-label-3 MuiTypography-body2 MuiTypography-displayInline"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </body>
    `)
  })

  it('renders with labels', () => {
    const result = renderComponent(
      <Slider
        value={23}
        handleOnChange={jest.fn()}
        title='this is a title of the slider'
        minLabel='$ MIN'
        maxLabel='$ MAX'
        min={0}
        max={0}
      />
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="MuiGrid-root MuiGrid-container MuiGrid-direction-xs-column MuiGrid-align-items-xs-center MuiGrid-justify-xs-center"
          >
            <span
              class="MuiTypography-root makeStyles-title-171 MuiTypography-caption"
            >
              this is a title of the slider
            </span>
            <div
              class="MuiGrid-root MuiGrid-item"
            >
              <div
                class="MuiGrid-root MuiGrid-container"
              >
                <div
                  class="MuiGrid-root MuiGrid-item"
                >
                  <p
                    class="MuiTypography-root makeStyles-label-170 MuiTypography-body2 MuiTypography-displayInline"
                  >
                    $ MIN
                  </p>
                </div>
                <div
                  class="MuiGrid-root makeStyles-sliderContainer-168 MuiGrid-item MuiGrid-grid-xs-true"
                >
                  <span
                    class="MuiSlider-root makeStyles-sliderRoot-169 MuiSlider-colorPrimary"
                  >
                    <span
                      class="MuiSlider-rail"
                    />
                    <span
                      class="MuiSlider-track makeStyles-track-173"
                    />
                    <input
                      type="hidden"
                      value="0"
                    />
                    <div
                      class="makeStyles-root-334"
                    />
                  </span>
                </div>
                <div
                  class="MuiGrid-root MuiGrid-item"
                >
                  <p
                    class="MuiTypography-root makeStyles-label-170 MuiTypography-body2 MuiTypography-displayInline"
                  >
                    $ MAX
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </body>
    `)
  })

  it('renders custom min/max', () => {
    const result = renderComponent(
      <Slider
        value={8}
        handleOnChange={jest.fn()}
        title='this is a title of the slider'
        minLabel={''}
        maxLabel={''}
        min={-20}
        max={20}
      />
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="MuiGrid-root MuiGrid-container MuiGrid-direction-xs-column MuiGrid-align-items-xs-center MuiGrid-justify-xs-center"
          >
            <span
              class="MuiTypography-root makeStyles-title-338 MuiTypography-caption"
            >
              this is a title of the slider
            </span>
            <div
              class="MuiGrid-root MuiGrid-item"
            >
              <div
                class="MuiGrid-root MuiGrid-container"
              >
                <div
                  class="MuiGrid-root MuiGrid-item"
                >
                  <p
                    class="MuiTypography-root makeStyles-label-337 MuiTypography-body2 MuiTypography-displayInline"
                  />
                </div>
                <div
                  class="MuiGrid-root makeStyles-sliderContainer-335 MuiGrid-item MuiGrid-grid-xs-true"
                >
                  <span
                    class="MuiSlider-root makeStyles-sliderRoot-336 MuiSlider-colorPrimary"
                  >
                    <span
                      class="MuiSlider-rail"
                    />
                    <span
                      class="MuiSlider-track makeStyles-track-340"
                      style="left: 0%; width: 70%;"
                    />
                    <input
                      type="hidden"
                      value="8"
                    />
                    <div
                      class="makeStyles-root-501"
                    />
                  </span>
                </div>
                <div
                  class="MuiGrid-root MuiGrid-item"
                >
                  <p
                    class="MuiTypography-root makeStyles-label-337 MuiTypography-body2 MuiTypography-displayInline"
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
