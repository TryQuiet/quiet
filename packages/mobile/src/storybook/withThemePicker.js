import {button} from '@storybook/addon-knobs';
import React from 'react';
import {ThemeProvider} from 'styled-components/native';

import {defaultTheme} from '../styles/themes/default.theme';

/**
 * This is intentionally kept in a value outside `withThemePicker` scope
 * to preserve `theme` value across different storybook components.
 */
let currentTheme = defaultTheme;

/**
 * Custom storybook decorator that adds ability to choose themes.
 */
export const withThemePicker = Story => {
  const groupId = 'Theme';

  button(
    'Default',
    () => {
      currentTheme = defaultTheme;
    },
    groupId,
  );

  return <ThemeProvider theme={currentTheme}>{Story()}</ThemeProvider>;
};
