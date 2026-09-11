import React from 'react'
import { mount } from 'cypress/react18'
import { it, describe, cy } from 'local-cypress'
import { withTheme } from '../../../storybook/decorators'
import { TextMessageComponent } from './TextMessage'

/**
 * Visual evidence for https://github.com/TryQuiet/quiet/issues/1618.
 *
 * Renders a message exactly as a malicious/careless sender could produce it
 * with shift+enter (a large run of blank lines before and after the real
 * content), on the RECEIVING side, using the production TextMessageComponent
 * unmodified. See TextMessage.blankLines.test.tsx and the accompanying report
 * for why no production code change was needed here.
 */
const rawSenderInput = '\n\n\n\n\nHello there!\n\n\n\n\nThis has a lot of blank lines around it.\n\n\n\n\n'

const codeFenceInput = '\n\n\n```\nfirst line\n\n\nlast line\n```\n\n\n'

const Demo: React.FC<{ label: string; raw: string; testId: string }> = ({ label, raw, testId }) => (
  <div style={{ padding: 16, background: '#fff', width: 520 }}>
    <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#888', marginBottom: 4 }}>{label}</div>
    <div
      style={{
        fontFamily: 'monospace',
        fontSize: 11,
        whiteSpace: 'pre',
        background: '#f2f2f2',
        border: '1px solid #ddd',
        padding: 8,
        marginBottom: 12,
      }}
    >
      {JSON.stringify(raw)}
    </div>
    <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#888', marginBottom: 4 }}>Rendered to the receiver:</div>
    <div style={{ border: '1px solid #ddd', padding: 8 }}>
      <TextMessageComponent message={raw} messageId={testId} pending={false} openUrl={() => {}} />
    </div>
  </div>
)

describe('TextMessage - issue #1618 blank line handling (visual evidence)', () => {
  it('a message padded with leading/trailing blank lines does not create a blank area on the receiver side', () => {
    mount(withTheme(() => <Demo label="Raw message string sent over the wire:" raw={rawSenderInput} testId="1618-blank" />))
    cy.wait(0)
    cy.screenshot('1618-blank-lines-current', { overwrite: true, capture: 'viewport' })
  })

  it('blank lines and content inside a fenced code block are left alone', () => {
    mount(withTheme(() => <Demo label="Raw message string sent over the wire:" raw={codeFenceInput} testId="1618-codefence" />))
    cy.wait(0)
    cy.screenshot('1618-code-fence-preserved', { overwrite: true, capture: 'viewport' })
  })
})
