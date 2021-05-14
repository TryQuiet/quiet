import {renderScreen} from '../../utils/functions/renderScreen/renderScreen';
import {SplashScreen} from './Splash.screen';

describe('SplashScreen', () => {
  it('should match inline snapshot', () => {
    const {toJSON} = renderScreen(SplashScreen);

    expect(toJSON()).toMatchInlineSnapshot();
  });
});
