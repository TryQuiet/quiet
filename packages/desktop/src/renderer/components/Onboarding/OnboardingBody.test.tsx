import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import { screen } from '@testing-library/dom'
import { render } from '@testing-library/react'
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles'
import type { Theme } from '@mui/material/styles'

import { renderComponent } from '../../testUtils/renderComponent'
import { lightTheme, darkTheme } from '../../theme'
import { OnboardingBody, BETA_WARNING } from './OnboardingBody'
import GetStartedComponent from './GetStartedComponent'

/**
 * The beta caption's ink, checked against the Quiet Design Library
 * (`0j7Nna9zWmfOSNmRmQK1Uh`). The frames draw this line as `Status`, Rubik 12/16
 * w400 in #222222 - on Get started (`6066:27523`) and on Join community
 * (`6072:19844`), and on every other node in the cache that carries the sentence.
 * That is the onboarding body ink (`colors.gray90`), not the library's general
 * caption grey, so `variant='caption'` on its own is the wrong colour here.
 */
const inTheme = (theme: Theme, ui: React.ReactElement) =>
  render(ui, {
    wrapper: ({ children }) => (
      <StyledEngineProvider injectFirst>
        <ThemeProvider theme={theme}>{children}</ThemeProvider>
      </StyledEngineProvider>
    ),
  })

const ink = (testId: string) => getComputedStyle(screen.getByTestId(testId)).color

const CAPTION_GREY = 'rgb(153, 153, 153)'
const LEGACY_LIGHT_GREY = 'rgb(178, 178, 178)'

describe('Onboarding beta caption', () => {
  it('is drawn in the frames ink, not in the default caption grey', () => {
    inTheme(lightTheme, <OnboardingBody heading='Let’s get started...' betaWarning dataTestId='body' />)

    expect(screen.getByTestId('onboardingBetaWarningText')).toHaveTextContent(BETA_WARNING)
    // `Status` 6066:27523 / 6072:19844: #222222.
    expect(ink('onboardingBetaWarningText')).toEqual('rgb(34, 34, 34)')
    // The two greys it has been drawn in instead: gray40, which is the caption
    // default, and the legacy lightGray that preceded it. Neither is in a frame.
    expect(ink('onboardingBetaWarningText')).not.toEqual(CAPTION_GREY)
    expect(ink('onboardingBetaWarningText')).not.toEqual(LEGACY_LIGHT_GREY)
  })

  it('inverts in the dark theme instead of disappearing into the background', () => {
    inTheme(darkTheme, <OnboardingBody heading='Let’s get started...' betaWarning dataTestId='body' />)

    // The frames only specify the light theme; gray90 is inverted for the dark one,
    // which is also what the library's Dark mode file draws 12px text in.
    expect(ink('onboardingBetaWarningText')).toEqual('rgb(255, 255, 255)')
    expect(ink('onboardingBetaWarningText')).not.toEqual(darkTheme.palette.background.default)
    expect(darkTheme.palette.background.default).toEqual('#222222')
  })

  it('keeps that ink on Get started, the screen the frame is drawn from', () => {
    inTheme(
      lightTheme,
      <GetStartedComponent onJoinCommunity={jest.fn()} onCreateCommunity={jest.fn()} onLinkDevices={jest.fn()} />
    )

    expect(ink('onboardingBetaWarningText')).toEqual('rgb(34, 34, 34)')
  })

  it('still renders under the app default theme, whichever that is', () => {
    renderComponent(<OnboardingBody heading='Let’s get started...' betaWarning dataTestId='body' />)

    expect(screen.getByTestId('onboardingBetaWarning')).toBeVisible()
    expect(ink('onboardingBetaWarningText')).not.toEqual(CAPTION_GREY)
  })
})

describe('Caption ink', () => {
  it('defaults to the library gray40, which is what a plain caption is drawn in', () => {
    // `Core/Gray 40` (5089:26217, 4391:20004) resolves to #999999, and 38 of the
    // 64 `Caption` text nodes in the library are 12/16 in it. #B2B2B2 is on no
    // caption in the library, and is not its gray30 either (that is #B3B3B3).
    expect(lightTheme.typography.caption.color).toEqual('#999999')
    expect(lightTheme.palette.colors.gray40).toEqual('#999999')
  })

  it('keeps the onboarding body ink separate from it, in both themes', () => {
    expect(lightTheme.palette.colors.gray90).toEqual('#222222')
    expect(darkTheme.palette.colors.gray90).toEqual('#FFFFFF')
  })
})
