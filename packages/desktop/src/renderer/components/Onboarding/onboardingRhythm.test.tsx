import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import { render } from '@testing-library/react'

import * as onboardingStories from '../../design-system/screens/OnboardingScreens.stories'
import { ONBOARDING_BAR_ZONE_HEIGHT, ONBOARDING_BLOCK_GAP, ONBOARDING_STAGE_INSET } from './onboardingRhythm'

/**
 * One vertical rhythm for the whole class.
 *
 * The complaint this pins down was that moving between onboarding screens jumped
 * vertically: Get started dropped the 60 bar zone altogether and Join community
 * put its graphic flush under the bar, so the block landed 76px apart on two
 * screens that are one tap from each other. The fix is that no stage sets its own
 * top padding or its own block gap — `OnboardingBody` owns both — so this sweeps
 * every story in the library rather than naming the screens that exist today. A
 * screen added later is covered as soon as it renders an `OnboardingBody`.
 */

/** Story exports are the library's record of the implemented screens. */
const stories = Object.entries(onboardingStories).filter(
  ([name, value]) => typeof value === 'function' && name !== 'default'
) as [string, () => React.ReactElement][]

/** The walkthrough drives itself with state; its steps are each covered by their own story. */
const SWEPT = stories.filter(([name]) => name !== 'Walkthrough')

describe('Onboarding vertical rhythm', () => {
  it('has stories to sweep', () => {
    expect(SWEPT.length).toBeGreaterThanOrEqual(25)
  })

  it.each(SWEPT)('%s puts its column at the class inset, with the class gap', (_name, Story) => {
    const { container, unmount } = render(<Story />)
    const columns = Array.from(container.querySelectorAll<HTMLElement>('[data-onboarding-body]'))

    for (const column of columns) {
      const style = getComputedStyle(column)
      expect(style.paddingTop).toBe(`${ONBOARDING_STAGE_INSET}px`)
      expect(style.rowGap || style.gap).toBe(`${ONBOARDING_BLOCK_GAP}px`)
    }

    unmount()
  })

  it('reserves the bar zone on every stage, Get started included', () => {
    for (const [name, Story] of SWEPT) {
      const { container, unmount } = render(<Story />)
      // The shell column is the 715 one; its first child is the bar zone.
      const shell = Array.from(container.querySelectorAll<HTMLElement>('div')).find(
        element => element.style.width === '715px' && element.style.minHeight === '560px'
      )
      if (!shell) {
        unmount()
        continue
      }
      const bar = shell.firstElementChild as HTMLElement | null
      expect(`${name}: ${bar?.style.height}`).toBe(`${name}: ${ONBOARDING_BAR_ZONE_HEIGHT}px`)
      unmount()
    }
  })

  it('leaves Get started an empty bar zone: reserved, but no title and no glyph', () => {
    const { container, unmount } = render(<onboardingStories.GetStarted />)
    const shell = Array.from(container.querySelectorAll<HTMLElement>('div')).find(
      element => element.style.width === '715px' && element.style.minHeight === '560px'
    )
    const bar = shell?.firstElementChild as HTMLElement

    expect(bar.style.height).toBe(`${ONBOARDING_BAR_ZONE_HEIGHT}px`)
    expect(bar.querySelector('button')).toBeNull()
    expect(bar.textContent).toBe('')
    unmount()
  })
})
