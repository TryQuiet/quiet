import { WebElement } from 'selenium-webdriver'
import { App } from './selectors'

export interface UserTestData<Messages = string[]> {
  username: string
  app: App
  messages: Messages
}

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

export enum UserListStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  NOT_FOUND = 'NOT_FOUND',
}
export interface UserListItem {
  element: WebElement | undefined
  status: UserListStatus
}
