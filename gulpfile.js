var gulp = require('gulp');
var header = require('gulp-header');
var del = require('del');
var fonts = require('gulp-google-webfonts');
var sass = require('gulp-sass');
var cleancss = require('gulp-clean-css');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var prettify = require('gulp-html-prettify')
var inject = require('gulp-inject');
var ga = require('gulp-ga');
var pkg = require('./package.json');

// Set the banner content
var banner = ['/*!\n',
    ' * <%= pkg.title %>: A Beastie Supported Production\n', 
    ' * Copyright 2017-' + (new Date()).getFullYear(), ' <%= pkg.author %>\n',
    ' * Licensed under <%= pkg.license %> \n',
    ' */\n',
    ''
].join('');

// Generate fonts css and copy into /_src/css
var fontoptions = {
    fontsDir: './fonts',
    cssFilename: 'google-fonts.css'
};

gulp.task('fonts', function() {
    del.sync('./_src/css/fonts');
    return gulp.src('./fonts.list')
        .pipe(fonts(fontoptions))
        .pipe(gulp.dest('./_src/css'));
});

// Compile SASS files from /_src/sass into /_src/css
gulp.task('sass', function() {
    return gulp.src('./_src/sass/main.scss')
        .pipe(sass())
        .pipe(gulp.dest('./_src/css'))
});

// Minify compiled CSS and copy into /_dist/css 
gulp.task('minify-css', gulp.series('fonts','sass', function() {
    return gulp.src('./_src/css/*.css')
        .pipe(concat('main.css'))
        .pipe(cleancss({ compatibility: 'ie8' }))
        .pipe(header(banner, { pkg: pkg }))
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest('./_dist/css'))
}));

// Minify JS and copy into /_dist/js 
gulp.task('minify-js', function() {
    return gulp.src('./_src/js/*.js')
        .pipe(concat('main.js'))
        .pipe(uglify())
        .pipe(header(banner, { pkg: pkg }))
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest('./_dist/js'))
});

// Concatenate HTML partials
gulp.task('concat', function() {
    return gulp.src('./_src/html/content/*.html')
    .pipe(inject(gulp.src(['./_src/html/partials/header.html']), {
        starttag: '<!-- inject:header:{{ext}} -->',
        transform: function (filepath, file) {
          return file.contents.toString('utf8')
        },
        removeTags: true
      }))
      .pipe(inject(gulp.src(['./_src/html/partials/footer.html']), {
        starttag: '<!-- inject:footer:{{ext}} -->',
        transform: function (filepath, file) {
          return file.contents.toString('utf8')
        },
        removeTags: true
      }))
    .pipe(gulp.dest('./_src/html/staged'))
});

// Write HTML files and copy into /_dist TODO inject scripts
gulp.task('html', gulp.series('concat', function() {
    return gulp.src('./_src/html/staged/*.html')
    .pipe(ga({url: pkg.url, uid: pkg.ga}))
    .pipe(prettify({indent_char: '  ', indent_size: 1}))
    .pipe(gulp.dest('./_dist'))
}));

// Copy fonts, images, and vendor libraries into /_dist
gulp.task('copy', async function() {
    // Images
    gulp.src('./_src/img/*')
        .pipe(gulp.dest('./_dist/img'))
    // Fonts
    gulp.src('./_src/css/fonts/*')
        .pipe(gulp.dest('./_dist/css/fonts'))
    // Bootstrap
    gulp.src(['node_modules/bootstrap/dist/**/*', '!**/npm.js', '!**/bootstrap-theme.*', '!**/*.map'])
        .pipe(gulp.dest('./_dist/vendor/bootstrap'))
    // jQuery
    gulp.src(['node_modules/jquery/dist/jquery.js', 'node_modules/jquery/dist/jquery.min.js'])
        .pipe(gulp.dest('./_dist/vendor/jquery'))
    // Normalize
    gulp.src('node_modules/normalize.css/normalize.css')
        .pipe(gulp.dest('./_dist/vendor/normalize'))
    // Modernizr
    gulp.src('node_modules/modernizr/lib/**/*')
        .pipe(gulp.dest('./_dist/vendor/modernizr'))
    // ...add more

    gulp.src([
            'node_modules/font-awesome/**',
            '!node_modules/font-awesome/**/*.map',
            '!node_modules/font-awesome/.npmignore',
            '!node_modules/font-awesome/*.txt',
            '!node_modules/font-awesome/*.md',
            '!node_modules/font-awesome/*.json'
        ])
        .pipe(gulp.dest('./_dist/vendor/font-awesome'))
})

// Run everything
gulp.task('default', 
    gulp.parallel('fonts','sass', 'minify-css', 'minify-js', 'concat', 'html','copy')
    );
