import './rn-addons';

import {withKnobs} from '@storybook/addon-knobs';
import {addDecorator, configure, getStorybookUI} from '@storybook/react-native';

import {withNavigation} from './navigationDecorator';
import {withLanguagePicker} from './withLanguagePicker';
import {withThemePicker} from './withThemePicker';

addDecorator(withKnobs);
addDecorator(withLanguagePicker);
addDecorator(withNavigation);
addDecorator(withThemePicker);

configure(() => {}, module);

const StorybookUIRoot = getStorybookUI({
  asyncStorage: null,
});

export default StorybookUIRoot;
