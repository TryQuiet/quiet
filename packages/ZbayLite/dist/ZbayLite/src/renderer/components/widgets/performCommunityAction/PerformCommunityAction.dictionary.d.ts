import { ReactElement } from 'react';
import { FieldData } from '../../../forms/types';
export interface PerformCommunityActionDictionary {
    header: string;
    label: string;
    placeholder: string;
    hint?: string;
    button?: string;
    field: FieldData;
    redirection?: ReactElement;
}
export declare const CreateCommunityDictionary: (handleRedirection?: () => void) => PerformCommunityActionDictionary;
export declare const JoinCommunityDictionary: (handleRedirection?: () => void) => PerformCommunityActionDictionary;
