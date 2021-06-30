import { storiesOf } from '@storybook/react-native';
import React from 'react';
import { storybookLog } from '../../utils/functions/storybookLog/storybookLog.function';

import { Registration } from './Registration.component';

storiesOf('Registration', module).add('Default', () => (
  <Registration registerUsernameAction={storybookLog('Username registered!')} />
));
