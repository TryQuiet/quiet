import OS from 'os-family';


const WINDOWS_ABSOLUTE_REGEXP = /^[A-Za-z]:/;
const UNIX_ABSOLUTE_REGEXP = /^\//;


export default function (testPath) {
    return OS.win && WINDOWS_ABSOLUTE_REGEXP.test(testPath) || UNIX_ABSOLUTE_REGEXP.test(testPath);
}
