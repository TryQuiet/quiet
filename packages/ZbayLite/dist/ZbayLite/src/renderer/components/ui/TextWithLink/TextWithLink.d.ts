import React from 'react';
import { TypographyProps } from '@material-ui/core';
export interface TextWithLinkProps {
    text: string;
    tagPrefix?: string;
    testIdPrefix?: string;
    links: [
        {
            tag: string;
            label: string;
            action: () => void;
        }
    ];
}
export declare const TextWithLink: React.FC<TextWithLinkProps & TypographyProps>;
export default TextWithLink;
