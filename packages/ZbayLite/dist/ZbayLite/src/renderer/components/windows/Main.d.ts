import React from 'react';
interface MainProps {
    match: {
        url: string;
    };
    isLogWindowOpened: boolean;
}
export declare const Main: React.FC<MainProps>;
export default Main;
