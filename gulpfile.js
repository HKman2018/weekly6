var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var del = require('del')
var autoprefixer = require('autoprefixer')
var cleanCSS = require('gulp-clean-css');
var uglify = require('gulp-uglify');
var mainBowerFiles = require('main-bower-files');
var envOptions = require('./envOptions')
var browserSync = require('browser-sync').create();
const webpack = require('webpack-stream');




gulp.task('clean', function() {
    return del(['./.tmp', './public'])
})



gulp.task('copyHtml', function() {
    return gulp.src('./source/**/*.html')
        .pipe(gulp.dest('./public/'))
})


gulp.task('pug', function() {
    return gulp.src('./source/**/*.pug')
        .pipe($.plumber())
        .pipe($.pug({
            pretty: true
        }))
        .pipe(gulp.dest('./public/'))
        .pipe(browserSync.stream());
    g
})


gulp.task('sass', function() {

    return gulp.src('./source/scss/**/*.scss')
        .pipe($.plumber())
        .pipe($.sourcemaps.init())
        .pipe($.sass().on('error', $.sass.logError))
        //編譯完成
        .pipe($.postcss([autoprefixer()]))
        .pipe($.if(envOptions.env === 'production', cleanCSS()))
        .pipe($.sourcemaps.write('.'))
        .pipe(gulp.dest('./public/css'))
        .pipe(browserSync.stream());
});
gulp.task('jquery', function() {
    return gulp.src('bower_components/jquery/dist/jquery.min.js')
        .pipe($.uglify())
        .pipe($.sourcemaps.write('.'))
        .pipe(gulp.dest('./public/js'))
        .pipe(browserSync.stream());
})

gulp.task('babel', function() {
    return gulp.src('./source/js/**/*.js')
        .pipe($.sourcemaps.init())
        .pipe($.babel({
            presets: ['@babel/env']
        }))
        .pipe(
            webpack({
                mode: 'development',
                output: {
                    filename: 'all.js',
                },
                module: {
                    rules: [{
                        test: /\.m?js$/,
                        exclude: /(node_modules|bower_components)/,
                        use: {
                            loader: 'babel-loader',
                        },
                    }, ],
                },
            })
        )
        .pipe($.concat('all.js'))
        .pipe($.if(envOptions.env === 'production', $.uglify({
            compress: {
                drop_console: true
            }
        })))
        .pipe($.sourcemaps.write('.'))
        .pipe(gulp.dest('./public/js'))
        .pipe(browserSync.stream());
})
gulp.task('imagesMin', function() {
    return gulp.src('./source/images/**/*')
        .pipe($.if(envOptions.env === 'production', $.imagemin()))
        .pipe(gulp.dest('./public/images'))
})

gulp.task('bower', function() {
    // var filterJS = gulpFilter('**/*.js', { restore: true });
    return gulp.src(mainBowerFiles({
            "overrides": { "bootstrap": { "main": ["dist/js/bootstrap.js", "dist/vue.js"] } }
        }))
        // .pipe(mainBowerFiles())
        // .pipe(concat('vendor.js'))
        // .pipe(uglify())
        // .pipe(filterJS.restore)
        .pipe(gulp.dest('./.tmp/vendors'))

});


gulp.task('vendorJs', function() {
    return gulp.src(['./.tmp/vendors/**/**.js'])
        // .pipe($.order([
        //     'jquery.js',
        //     'bootstrap.js'
        // ]))
        .pipe($.concat('vendor.js'))
        .pipe($.if(envOptions.env === 'production', $.uglify()))
        .pipe(gulp.dest('./public/javascripts'))
})

gulp.task('deploy', function() {
    return gulp.src('./public/**/*')
        .pipe($.ghPages())
})

gulp.task('build', gulp.series('clean', 'pug', 'babel', 'sass', 'bower', 'vendorJs', 'imagesMin', 'jquery'))

gulp.task('default', gulp.series('bower', 'vendorJs', gulp.parallel('pug', 'sass', 'babel', 'imagesMin', 'jquery'),
    function(done) {
        browserSync.init({
            server: {
                baseDir: "public/",
                index: "index.html",
                page: "page.html"
            },
            // startPath: "/html",
            reloadDebounce: 2000,
        });
        gulp.watch(['./source/scss/**/*.scss', './source/scss/**/*.sass'], gulp.series('sass'));
        gulp.watch(['./source/**/*.pug'], gulp.series('pug'));
        gulp.watch(['./source/js/**/*.js'], gulp.series('babel'));
        done();
    }
))