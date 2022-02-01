import React from 'react';
interface ElipsisProps {
    content: string;
    length: number;
    tooltipPlacement?: 'bottom-start' | 'bottom' | 'bottom-end';
    interactive?: boolean;
}
export declare const Elipsis: React.FC<ElipsisProps>;
export default Elipsis;
