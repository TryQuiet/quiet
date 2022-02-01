import { DisplayableMessage } from '@zbayapp/nectar';
export declare const createNotification: ({ title, body, data }: {
    title: string;
    body: string;
    data: any;
}) => Promise<Notification>;
export declare const displayDirectMessageNotification: ({ message, username }: {
    message: DisplayableMessage;
    username: string;
}) => Promise<Notification>;
declare const _default: {
    createNotification: ({ title, body, data }: {
        title: string;
        body: string;
        data: any;
    }) => Promise<Notification>;
};
export default _default;
