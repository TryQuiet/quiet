/**
 * Renders every ChannelComponent story the way Storybook does.
 *
 * The build tsconfig excludes `*.stories.tsx`, so a story that stops passing a prop the component
 * requires type-checks clean and only fails when something renders it. That is what happened when
 * the channel header started reading `members.length`: all twenty-one stories bound to the shared
 * template threw, and the first place it showed up was the visual-regression build.
 */
import React from 'react'
import { render } from '@testing-library/react'
import { withTheme } from '../../storybook/decorators'
import * as stories from './Channel.stories'

describe('ChannelComponent stories', () => {
  beforeAll(() => {
    // jsdom has no ResizeObserver; react-resize-detector constructs one on mount.
    window.ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }))
  })

  const entries = Object.entries(stories).filter(([name]) => name !== 'default')

  it('has stories to render', () => {
    expect(entries.length).toBeGreaterThan(20)
  })

  it.each(entries)('renders %s without throwing', (_name, story) => {
    const Story = story as unknown as ((args: Record<string, unknown>) => JSX.Element) & {
      args?: Record<string, unknown>
    }
    if (typeof Story !== 'function') return

    const errors: string[] = []
    const consoleError = jest.spyOn(console, 'error').mockImplementation((...args) => {
      const text = String(args[0] ?? '')
      // React reports a render throw through console.error before rethrowing.
      if (text.includes('The above error occurred') || text.includes('Uncaught [')) errors.push(text.split('\n')[0])
    })

    try {
      const Wrapped = () => Story(Story.args ?? {})
      const { container } = render(withTheme(Wrapped as never) as React.ReactElement)
      expect(errors).toEqual([])
      // A story that renders an empty tree is indistinguishable from a broken one in a snapshot.
      expect(container.innerHTML.length).toBeGreaterThan(0)
    } finally {
      consoleError.mockRestore()
    }
  })
})
