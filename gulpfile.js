const gulp = require('gulp');
const gulpTS = require('gulp-typescript');
const gulpSourceMaps = require('gulp-sourcemaps');
const del = require('del');
const mergeStream = require('merge-stream');
const gulpFile = require('gulp-file');
const gulpShell = require('gulp-shell');
const gulpMocha = require('gulp-mocha');
const gulpUglify = require('gulp-uglify');

const gulpDependencies = [
    'del',
    'gulp',
    'gulp-rename',
    'gulp-sourcemaps',
    'gulp-typescript',
    'gulp-uglify',
    'merge-stream',
    'gulp-file',
    'gulp-shell',
    'gulp-mocha'
];
const testDependencies = [
    '@types/mocha',
    'mocha',
    '@types/chai',
    'chai'
];

const baseProject = gulpTS.createProject('./tsconfig.json');
const tsReleaseProject = gulpTS.createProject('./tsconfig.release.json');
const tsTestProject = gulpTS.createProject('./tsconfig.test.json');

function compileProjectTask(project, options) {
    options = options || {};
    return () => {
        let compileStream = project.src();
        if (project.options.sourceMap === true) {
            compileStream = compileStream.pipe(gulpSourceMaps.init());
        }
        compileStream = compileStream.pipe(project());
        let jsStream = compileStream.js;
        if (options.uglify === true) {
            jsStream = jsStream.pipe(gulpUglify());
        }
        if (project.options.sourceMap === true) {
            jsStream = jsStream.pipe(gulpSourceMaps.write());
        }
        let outDir = project.options.outDir;
        if (options.outPath !== undefined) {
            outDir += `/${options.outPath}`;
        }
        return mergeStream(
            compileStream.dts,
            jsStream
        ).pipe(gulp.dest(outDir))
    }
}

function bundleFilesTask(project) {
    return function bundleFiles() {
        return gulp.src(['LICENSE', 'README.md'])
            .pipe(gulp.dest(project.options.outDir));
    };
}

function preparePackageJsonTask(project) {
    return function preparePackageJson() {
        const pack = require('./package.json');
        for (let gulpDependency of gulpDependencies) {
            delete pack.devDependencies[gulpDependency];
        }
        for (let testDependency of testDependencies) {
            delete pack.devDependencies[testDependency];
        }
        pack.main = 'lib/index.js';
        pack.files = 'lib';
        if (project.options.declaration === true) {
            pack.types = 'lib/index.d.js';
        }
        return gulpFile('package.json', JSON.stringify(pack, null, 2), { src: true })
            .pipe(gulp.dest(project.options.outDir));
    };
}

function runMochaTask(project) {
    return function mocha() {
        return gulp.src(project.options.outDir + '/**/*.spec.js')
            .pipe(gulpMocha());
    };
}

gulp.task('clean', () => {
    return del(baseProject.options.outDir);
});

gulp.task('compile', compileProjectTask(tsReleaseProject));
gulp.task('compileRelease', compileProjectTask(tsReleaseProject, {
    outPath: 'lib',
    uglify: true
}));
gulp.task('compileTesting', compileProjectTask(tsTestProject));

gulp.task('default', gulp.series(
    'clean',
    'compile'
));

gulp.task('test', gulp.series(
    'clean',
    'compileTesting',
    runMochaTask(tsTestProject)
));

gulp.task('deploy', gulp.series(
    'clean',
    'compileRelease',
    preparePackageJsonTask(tsReleaseProject),
    bundleFilesTask(tsReleaseProject),
    gulpShell.task(`npm publish ${tsReleaseProject.options.outDir}`)
));
