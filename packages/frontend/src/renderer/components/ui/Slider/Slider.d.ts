import { SliderProps } from '@material-ui/core/Slider'

export interface ISliderProps {
  value: number
  handleOnChange: SliderProps['onChange']
  title: string
  minLabel: string
  maxLabel: string
  min: number
  max: number
}
