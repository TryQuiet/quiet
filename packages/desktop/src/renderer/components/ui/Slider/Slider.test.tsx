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
            class="MuiGrid-root MuiGrid-container MuiGrid-direction-xs-column css-19axq9c-MuiGrid-root"
          >
            <span
              class="MuiTypography-root MuiTypography-caption Slidertitle css-1d4bzk2-MuiTypography-root"
            >
              this is a title of the slider
            </span>
            <div
              class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
            >
              <div
                class="MuiGrid-root MuiGrid-container css-11lq3yg-MuiGrid-root"
              >
                <div
                  class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                >
                  <p
                    class="MuiTypography-root MuiTypography-body2 Sliderlabel css-1be0cgg-MuiTypography-root"
                  />
                </div>
                <div
                  class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-true SlidersliderContainer css-1vd824g-MuiGrid-root"
                >
                  <span
                    class="MuiSlider-root SlidersliderRoot MuiSlider-colorPrimary MuiSlider-sizeMedium css-1diqobq-MuiSlider-root"
                  >
                    <span
                      class="MuiSlider-rail css-14pt78w-MuiSlider-rail"
                    />
                    <span
                      class="MuiSlider-track Slidertrack css-1gv0vcd-MuiSlider-track"
                    />
                    <div
                      class="SliderThumbroot css-1o0xzn6"
                    />
                  </span>
                </div>
                <div
                  class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                >
                  <p
                    class="MuiTypography-root MuiTypography-body2 Sliderlabel css-1be0cgg-MuiTypography-root"
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
            class="MuiGrid-root MuiGrid-container MuiGrid-direction-xs-column css-19axq9c-MuiGrid-root"
          >
            <span
              class="MuiTypography-root MuiTypography-caption Slidertitle css-1d4bzk2-MuiTypography-root"
            >
              this is a title of the slider
            </span>
            <div
              class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
            >
              <div
                class="MuiGrid-root MuiGrid-container css-11lq3yg-MuiGrid-root"
              >
                <div
                  class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                >
                  <p
                    class="MuiTypography-root MuiTypography-body2 Sliderlabel css-1be0cgg-MuiTypography-root"
                  >
                    $ MIN
                  </p>
                </div>
                <div
                  class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-true SlidersliderContainer css-1vd824g-MuiGrid-root"
                >
                  <span
                    class="MuiSlider-root SlidersliderRoot MuiSlider-colorPrimary MuiSlider-sizeMedium css-1diqobq-MuiSlider-root"
                  >
                    <span
                      class="MuiSlider-rail css-14pt78w-MuiSlider-rail"
                    />
                    <span
                      class="MuiSlider-track Slidertrack css-1gv0vcd-MuiSlider-track"
                    />
                    <div
                      class="SliderThumbroot css-1o0xzn6"
                    />
                  </span>
                </div>
                <div
                  class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                >
                  <p
                    class="MuiTypography-root MuiTypography-body2 Sliderlabel css-1be0cgg-MuiTypography-root"
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
            class="MuiGrid-root MuiGrid-container MuiGrid-direction-xs-column css-19axq9c-MuiGrid-root"
          >
            <span
              class="MuiTypography-root MuiTypography-caption Slidertitle css-1d4bzk2-MuiTypography-root"
            >
              this is a title of the slider
            </span>
            <div
              class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
            >
              <div
                class="MuiGrid-root MuiGrid-container css-11lq3yg-MuiGrid-root"
              >
                <div
                  class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                >
                  <p
                    class="MuiTypography-root MuiTypography-body2 Sliderlabel css-1be0cgg-MuiTypography-root"
                  />
                </div>
                <div
                  class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-true SlidersliderContainer css-1vd824g-MuiGrid-root"
                >
                  <span
                    class="MuiSlider-root SlidersliderRoot MuiSlider-colorPrimary MuiSlider-sizeMedium css-1diqobq-MuiSlider-root"
                  >
                    <span
                      class="MuiSlider-rail css-14pt78w-MuiSlider-rail"
                    />
                    <span
                      class="MuiSlider-track Slidertrack css-1gv0vcd-MuiSlider-track"
                      style="left: 0%; width: 70%;"
                    />
                    <div
                      class="SliderThumbroot css-1o0xzn6"
                    />
                  </span>
                </div>
                <div
                  class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                >
                  <p
                    class="MuiTypography-root MuiTypography-body2 Sliderlabel css-1be0cgg-MuiTypography-root"
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
