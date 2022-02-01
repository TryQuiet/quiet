import React, { MouseEvent } from 'react';
export interface MentionElementProps {
    name: string;
    channelName: string;
    participant?: boolean;
    highlight?: boolean;
    onMouseEnter: () => void;
    onClick: (e: MouseEvent) => void;
}
export declare const MentionElement: React.FC<MentionElementProps>;
export default MentionElement;
