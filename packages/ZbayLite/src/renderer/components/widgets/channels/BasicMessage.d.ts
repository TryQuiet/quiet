import { DisplayableMessage } from "../../../zbay/messages.types";

export interface IBasicMessageProps {
  message: DisplayableMessage;
  setActionsOpen: (open: boolean) => void;
  actionsOpen: boolean;
  allowModeration: boolean;
}
