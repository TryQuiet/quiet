import Config from 'react-native-config';
import { NodeEnv } from './utils/const/NodeEnv.enum';
import { store } from './store/store';

if (Config.NODE_ENV === NodeEnv.Development) {
  const DevMenu = require('react-native-dev-menu');

  DevMenu.addItem('Get store state', () => {
    console.info(JSON.stringify(store.getState(), null, 2));
  });
}
