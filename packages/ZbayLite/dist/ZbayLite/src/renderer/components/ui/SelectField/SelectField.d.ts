import React, { ReactElement } from 'react';
interface SelectFieldProps {
    name: string;
    id?: string;
    children?: ReactElement;
    [s: string]: any;
}
export declare const SelectField: React.FC<SelectFieldProps>;
export default SelectField;
