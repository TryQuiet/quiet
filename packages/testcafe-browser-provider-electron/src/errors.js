import dedent from 'dedent';
import { render as renderTemplate } from 'mustache';
import CONSTANTS from './constants';

export default {
    mainUrlWasNotLoaded: dedent `
        The main window page at {{{mainWindowUrl}}} was not loaded.
        Use the mainWindowUrl option to specify one of the following pages as the main window page:
        
        {{#openedUrls}}
        {{{.}}}
        {{/openedUrls}}
    `,

    render (template, data) {
        return CONSTANTS.electronErrorMarker + renderTemplate(template, data);
    }
};
