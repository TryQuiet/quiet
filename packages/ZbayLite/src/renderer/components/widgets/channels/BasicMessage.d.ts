import { DisplayableMessage } from '@zbayapp/nectar/lib/sagas/publicChannels/publicChannels.types'
export interface IBasicMessageProps {
  message: DisplayableMessage
  setActionsOpen: (open: boolean) => void
  actionsOpen: boolean
  allowModeration?: boolean
}
