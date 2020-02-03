var path         = require('path');
var gulp         = require('gulp');
var babel        = require('gulp-babel');
var eslint       = require('gulp-eslint');
var del          = require('del');
var childProcess = require('child_process');
var asar         = require('asar');


var PACKAGE_PARENT_DIR  = path.join(__dirname, '../');
var PACKAGE_SEARCH_PATH = (process.env.NODE_PATH ? process.env.NODE_PATH + path.delimiter : '') + PACKAGE_PARENT_DIR;

process.env.NODE_PATH = PACKAGE_SEARCH_PATH;

var APP_DIR             = path.join(__dirname, 'test/data/test-app-regular');
var ASAR_ARCHIVE_PATH   = path.join(__dirname, 'test/data/test-app.asar');
var CONFIG_PATH_REGULAR = path.join(__dirname, 'test/data/app-config-regular');
var CONFIG_PATH_ASAR    = path.join(__dirname, 'test/data/app-config-asar');
var CONFIG_PATH_JS      = path.join(__dirname, 'test/data/app-config-js');

function clean () {
    return del(['lib', '.screenshots']);
}

function lint () {
    return gulp
        .src([
            'src/**/*.js',
            'test/**/*.js',
            'Gulpfile.js'
        ])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
}

function build () {
    return gulp
        .src('src/**/*.js')
        .pipe(babel())
        .pipe(gulp.dest('lib'));
}

function testRegularApp () {
    delete process.env.ASAR_MODE;

    return childProcess.spawn('testcafe', ['electron:' + CONFIG_PATH_REGULAR, 'test/fixtures/**/*-test.js', '-s', '.screenshots'], { shell: true, stdio: 'inherit' });
}

gulp.task('pack-to-asar-archive', () => asar.createPackage(APP_DIR, ASAR_ARCHIVE_PATH));

function testAsarApp () {
    process.env.ASAR_MODE = 'true';

    return childProcess.spawn('testcafe', ['electron:' + CONFIG_PATH_ASAR, 'test/fixtures/**/*-test.js', '-s', '.screenshots'], { shell: true, stdio: 'inherit' });
}

function testJsConfig () {
    delete process.env.ASAR_MODE;

    return childProcess.spawn('testcafe', ['electron:' + CONFIG_PATH_JS, 'test/fixtures/**/*-test.js', '-s', '.screenshots'], { shell: true, stdio: 'inherit' });
}
function testJsConfigSpecifically () {
    delete process.env.ASAR_MODE;

    return childProcess.spawn('testcafe', ['electron:' + CONFIG_PATH_JS + '/.testcafe-electron-rc.js', 'test/fixtures/**/*-test.js', '-s', '.screenshots'], { shell: true, stdio: 'inherit' });
}

exports.lint  = lint;
exports.build = gulp.parallel(lint, gulp.series(clean, build));
exports.test  = gulp.series(
    exports.build,
    testRegularApp,
    testJsConfigSpecifically,
    testJsConfig,
    'pack-to-asar-archive',
    testAsarApp
);
