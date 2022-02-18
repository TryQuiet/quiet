import dedent from 'dedent';
import { render as renderTemplate } from 'mustache';


export default {
    mainUrlWasNotLoaded: dedent `
        The main window page at {{{mainWindowUrl}}} was not loaded.
        Use the mainWindowUrl option to specify one of the following pages as the main window page:
        
        {{#openedUrls}}
        {{{.}}}
        {{/openedUrls}}
    `,

    invalidMenuItemArgument: 'Invalid menu item argument',

    render (template, data) {
        return renderTemplate(template, data);
    }
};
