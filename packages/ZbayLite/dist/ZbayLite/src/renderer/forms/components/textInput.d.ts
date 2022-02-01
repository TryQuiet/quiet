import React from 'react';
import { DeepMap, FieldError, FieldValues, Noop } from 'react-hook-form';
import { TextFieldProps } from '@material-ui/core/TextField';
export declare type TextInputProps = TextFieldProps & {
    errors: DeepMap<FieldValues, FieldError>;
    classes: string;
    onchange: (...event: any[]) => void;
    onblur: Noop;
};
export declare const TextInput: React.FC<TextInputProps>;
