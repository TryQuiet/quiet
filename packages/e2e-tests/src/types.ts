import { App } from './selectors'

export interface MessageIds {
  messageId: string
  parentMessageId: string
}

export interface RetryConfig {
  attempts: number
  timeoutMs: number
}

export interface TimeoutMetadata {
  id: NodeJS.Timeout
  promise: Promise<unknown>
}

export interface UserTestData {
  username: string
  app: App
  messages: string[]
}
