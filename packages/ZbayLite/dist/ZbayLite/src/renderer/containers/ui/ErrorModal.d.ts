export declare const useErrorModalData: () => {
    message: string;
    traceback: string;
};
export declare const useErrorModalActions: () => {
    restartApp: () => void;
};
declare const ErrorModalContainer: () => JSX.Element;
export default ErrorModalContainer;
