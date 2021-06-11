import { InitCheck } from '../../store/init/init.types';

export interface LoadingProps {
  progress: number;
  description: string;
  checks?: InitCheck[];
}
