import { FunctionComponent } from 'react';
import { TextFieldProps } from 'formik-material-ui';
interface FormikLinkedTextFieldProps {
    variant: 'standard' | 'filled' | 'outlined';
    transformer: number;
    otherField: string;
    precise: number;
    [s: string]: any;
}
export declare const formikLinkedTextField: FunctionComponent<TextFieldProps & FormikLinkedTextFieldProps>;
export {};
