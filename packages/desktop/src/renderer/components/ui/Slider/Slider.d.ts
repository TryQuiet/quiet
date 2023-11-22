import { SliderProps } from '@mui/material/Slider'

export interface ISliderProps {
    value: number
    handleOnChange: SliderProps['onChange']
    title: string
    minLabel: string
    maxLabel: string
    min: number
    max: number
}
