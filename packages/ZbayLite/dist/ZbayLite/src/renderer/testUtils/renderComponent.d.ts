import { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { Store } from 'redux';
export declare const renderComponent: (ui: ReactElement, storeState?: Store) => ReturnType<typeof render>;
