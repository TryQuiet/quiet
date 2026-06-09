import { WebElement } from 'selenium-webdriver'
import { App, Channel } from './selectors'

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

export interface NewMessageDM {
  successfulUsers: string[]
  failedUsers: string[]
}

export interface CreatedDM extends NewMessageDM {
  success: boolean
}

export enum TestChannelType {
  PUBLIC_CHANNEL = 'publicChannel',
  PRIVATE_CHANNEL = 'privateChannel',
  DM = 'dm',
}

export enum TestAddNewChannelButtonId {
  PRE_DMS = 'addChannelButton',
  DMS = 'sidebar-button-createChannel',
}

export interface TestAddNewChannelOptions {
  isPublic: boolean
  expectToggle: boolean
  buttonId: TestAddNewChannelButtonId
}

export interface TestNewChannelResult {
  channel?: Channel
  errors?: Error[]
}

export const DEFAULT_ADD_NEW_CHANNEL_OPTIONS: TestAddNewChannelOptions = {
  isPublic: true,
  expectToggle: true,
  buttonId: TestAddNewChannelButtonId.DMS,
}

export const DEFAULT_ADD_NEW_CHANNEL_NONADMIN_OPTIONS: TestAddNewChannelOptions = {
  isPublic: true,
  expectToggle: false,
  buttonId: TestAddNewChannelButtonId.DMS,
}

export const DEFAULT_ADD_NEW_CHANNEL_PRIVATE_OPTIONS: TestAddNewChannelOptions = {
  isPublic: false,
  expectToggle: true,
  buttonId: TestAddNewChannelButtonId.DMS,
}
