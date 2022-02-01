import { ValidationOptions } from 'class-validator';
export declare function IsCsr(validationOptions?: ValidationOptions): (object: Object, propertyName: string) => void;
export declare function CsrContainsFields(validationOptions?: ValidationOptions): (object: Object, propertyName: string) => void;
