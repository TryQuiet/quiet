import React from 'react';
import { DisplayableMessage } from '@zbayapp/nectar';
export declare const getTimeFormat: () => string;
export declare const transformToLowercase: (string: string) => string;
export interface BasicMessageProps {
    messages: DisplayableMessage[];
}
export declare const BasicMessageComponent: React.FC<BasicMessageProps>;
export default BasicMessageComponent;
