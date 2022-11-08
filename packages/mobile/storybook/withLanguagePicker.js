import {button} from '@storybook/addon-controls';
import i18next from 'i18next';

import {Languages} from '../src/translations/const/Languages.enum';

/**
 * Custom storybook decorator that adds ability to choose languages.
 */
export const withLanguagePicker = Story => {
  const groupId = 'Language';

  button(
    'Polish',
    () => {
      void i18next.changeLanguage(Languages.Polish);
    },
    groupId,
  );

  button(
    'English',
    () => {
      void i18next.changeLanguage(Languages.English);
    },
    groupId,
  );

  return Story();
};
