//@ts-check

const { src, dest, watch, parallel, series } = require('gulp');
const pug = require('gulp-pug');
const postcss = require('gulp-postcss');
const purgecss = require('gulp-purgecss');
const browserSync = require('browser-sync').create();

// Custom PurgeCSS extractor for Tailwind that allows special characters in
// class names.
//
// https://github.com/FullHuman/purgecss#extractor
class TailwindExtractor {
    static extract(content) {
        return content.match(/[A-Za-z0-9-_:\/]+/g) || [];
    }
}

function cssTask() {
    return src('src/**/*.css')
        .pipe(postcss([
            require('tailwindcss'),
            require('postcss-preset-env')({
                stage: 3,
                features: {
                    'nesting-rules': true
                }
            })
        ]))
        .pipe(dest('dist'))
        .pipe(browserSync.stream());
}

// https://stackoverflow.com/questions/29793894/how-to-set-gulp-dest-in-same-directory-as-pipe-inputs
function htmlTask() {
    return src(['src/**/*.pug'])
        .pipe(pug())
        .pipe(dest('dist'))
        .pipe(browserSync.stream());
}

function browserSyncTask() {
    browserSync.init({
        server: {
            baseDir: 'dist'
        },
    });
}

function buildCSS() {
    return src('src/**/*.css')
        .pipe(postcss([
            require('tailwindcss'),
            require('postcss-preset-env')({
                features: {
                    'nesting-rules': true
                }
            }),
            require('autoprefixer')({
                cascade: false
            })
        ]))
        .pipe(purgecss({
            content: ['src/**/*.pug', 'src/**/*.css'],
            extractors: [
                {
                    extractor: TailwindExtractor,

                    // Specify the file extensions to include when scanning for
                    // class names.
                    extensions: ['pug', 'css']
                }
            ]
        }))
        .pipe(dest('dist'));
}

function buildHTML() {
    return src(['src/**/*.pug'])
        .pipe(pug())
        .pipe(dest('dist'));
}

function watchFiles() {
    watch('src/**/*.css', cssTask);
    watch('src/**/*.pug', htmlTask);
}

exports.build = parallel(buildHTML, buildCSS);

exports.default = series(parallel(cssTask, htmlTask), parallel(browserSyncTask, watchFiles));
