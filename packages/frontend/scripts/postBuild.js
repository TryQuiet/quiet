
const fs = require('fs')
const crypto = require('crypto')
const yaml = require('js-yaml')
const glob = require('glob');

let appImagePath

glob(__dirname + '/**/*.AppImage', {}, (err, files) => {
    console.log(files)
    appImagePath = files[0]
})

function checksum(file = appImagePath, algorithm = 'sha512', encoding = 'base64', options) {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash(algorithm);
        hash.on('error', reject).setEncoding(encoding);
        fs.createReadStream(
            file,
            Object.assign({}, options, {
                highWaterMark: 1024 * 1024,
                /* better to use more memory but hash faster */
            })
        )
            .on('error', reject)
            .on('end', () => {
                hash.end();
                resolve(hash.read());
            })
            .pipe(
                hash,
                {
                    end: false,
                }
            );
    });
}

const aloha = async () => {
    const newChecksum = await checksum()
    try {
        let fileContents = fs.readFileSync('./alpha-linux.yml', 'utf8');
        let data = yaml.load(fileContents);

        data.files[0].sha512 = newChecksum
        data.sha512 = newChecksum
        console.log(data);

        let yamlStr = yaml.dump(data);
        fs.writeFileSync('alpha-linux.yml', yamlStr, 'utf8');

    } catch (e) {
        console.log(e);
    }
}

glob(__dirname + '/**/*.AppImage', {}, (err, files) => {
    console.log(files)
    appImagePath = files[0]
    aloha()
})

