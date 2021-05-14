import {button} from '@storybook/addon-knobs';
import i18next from 'i18next';

import {Languages} from '../translations/const/Languages.enum';

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
