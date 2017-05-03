import { statSync } from 'fs';


export default function (testPath) {
    return statSync(testPath).isDirectory();
}
