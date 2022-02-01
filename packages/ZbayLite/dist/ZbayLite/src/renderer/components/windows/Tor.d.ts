import React from 'react';
import 'react-alice-carousel/lib/alice-carousel.css';
interface TorProps {
    checkDeafult: () => void;
    tor: {
        enabled: any;
        error: string;
        url: string;
    };
    setUrl: ({ url }: {
        url: string;
    }) => void;
    setEnabled: ({ enabled }: {
        enabled: boolean;
    }) => void;
    checkTor: () => void;
}
export declare const Tor: React.FC<TorProps>;
export default Tor;
