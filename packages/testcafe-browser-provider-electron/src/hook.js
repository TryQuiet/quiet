import { readFileSync } from 'fs';
import { join as joinPaths } from 'path';
import { render as renderTemplate } from 'mustache';


const HOOK_TEMPLATE = readFileSync(joinPaths(__dirname, '../templates/hook.js.mustache')).toString();

const INJECTABLE_PATH = JSON.stringify(require.resolve('./injectable'));

export default function (config, testPageUrl) {
    return renderTemplate(HOOK_TEMPLATE, {
        INJECTABLE_PATH: INJECTABLE_PATH,
        CONFIG:          JSON.stringify(config),
        TEST_PAGE_URL:   JSON.stringify(testPageUrl)
    });
}
