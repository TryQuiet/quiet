import React from 'react';
interface PulseDotProps {
    className?: string;
    size?: number;
    color: 'healthy' | 'syncing' | 'down' | 'restarting' | 'connecting';
}
export declare const PulseDot: React.FC<PulseDotProps>;
export default PulseDot;
