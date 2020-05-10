var gulp = require('gulp');
var $ = require('gulp-load-plugins')();

var autoprefixer = require('autoprefixer')
var cleanCSS = require('gulp-clean-css');
var minimist = require('minimist');
var mainBowerFiles = require('main-bower-files');
var browserSync = require('browser-sync').create();



var envOptions = {
    string: 'env',
    default: {
        env: 'develop'
    }
}
var options = minimist(process.argv.slice(2), envOptions)
console.log(options)


gulp.task('clean', function() {
    return gulp.src(['./.tmp', './public'], { read: false })
        .pipe($.clean())
})



gulp.task('copyHtml', function() {
    return gulp.src('./source/**/*.html')
        .pipe(gulp.dest('./public/'))
})

// gulp.task('jade', function() {
//     return gulp.src('./source/**/*.jade')
//         .pipe($.plumber())
//         .pipe($.jade({ pretty: true }))
//         .pipe(gulp.dest('./public/'))
//         .pipe(
//             browserSync.reload({
//                 stream: true,
//             }),
//         );
// });
gulp.task('pug', function() {
    return gulp.src('./source/**/*.pug')
        .pipe($.plumber())
        .pipe($.pug({
            pretty: true
        }))
        .pipe(gulp.dest('./public/'))
        .pipe(
            browserSync.reload({
                stream: true,
            }),
        );
})


gulp.task('sass', function() {

    return gulp.src('./source/scss/**/*.scss')
        .pipe($.plumber())
        .pipe($.sourcemaps.init())
        .pipe($.sass().on('error', $.sass.logError))
        //編譯完成
        .pipe($.postcss([autoprefixer()]))
        .pipe($.if(options.env === 'production', cleanCSS()))
        .pipe($.sourcemaps.write('.'))
        .pipe(gulp.dest('./public/css'))
        .pipe(browserSync.stream());
});

gulp.task('babel', function() {
    return gulp.src('./source/js/**/*.js')
        .pipe($.sourcemaps.init())
        .pipe($.babel({
            presets: ['@babel/env']
        }))
        .pipe($.concat('all.js'))
        .pipe($.if(options.env === 'production', $.uglify({
            compress: {
                drop_console: true
            }
        })))
        .pipe($.sourcemaps.write('.'))
        .pipe(gulp.dest('./public/js'))
        .pipe(browserSync.stream());
})
gulp.task('imagesMin', function() {
    return gulp.src('./source/images/*')
        .pipe($.if(options.env === 'production', $.imagemin()))
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
        .pipe($.if(options.env === 'production', $.uglify()))
        .pipe(gulp.dest('./public/javascripts'))
})



gulp.task('build', gulp.series('clean', 'pug', 'babel', 'sass', 'bower', 'vendorJs'))

gulp.task('default', gulp.series('bower', 'vendorJs', gulp.parallel('pug', 'sass', 'babel', 'imagesMin'),
    function(done) {
        browserSync.init({
            server: {
                baseDir: "./public"
            },
            reloadDebounce: 2000,
        });
        gulp.watch(['./source/scss/**/*.scss', './source/scss/**/*.sass'], gulp.series('sass'));
        gulp.watch(['./source/**/*.pug'], gulp.series('pug'));
        gulp.watch(['./source/js/**/*.js'], gulp.series('babel'));
        done();
    }
))