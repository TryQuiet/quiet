import { WebElement } from 'selenium-webdriver'
import { App } from './selectors'

export interface UserTestData<Messages = string[]> {
  username: string
  app: App
  messages: Messages
}

export type TestMessages<T extends string, U = string[]> = Required<Record<T, U>>

export interface UserTestData2<T extends string, U = string[]> {
  username: string
  app: App
  messages: Required<TestMessages<T, U>>
}

export type UserTestDataMap<T extends string, U extends UserTestData2<any, any>> = Required<Record<T, U>>

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
  textMatches: boolean
}
