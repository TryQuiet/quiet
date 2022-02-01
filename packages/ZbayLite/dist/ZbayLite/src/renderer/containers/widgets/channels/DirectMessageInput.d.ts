/// <reference types="react" />
export declare const useDirectMessageInputActions: () => {
    onChange: (_value: string) => void;
    resetDebounce: () => void;
    onEnter: (message: string) => void;
};
export declare const ChannelInput: () => JSX.Element;
export default ChannelInput;
