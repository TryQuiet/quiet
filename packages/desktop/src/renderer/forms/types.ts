import { RegisterOptions } from 'react-hook-form'

export interface FieldProps {
    label: string
    name: string
    type: string
    placeholder: string
}

export interface FieldData {
    fieldProps: FieldProps
    validation: RegisterOptions
}

export type FieldsProps<FormValues> = {
    [fieldName in keyof FormValues]: FieldData
}
