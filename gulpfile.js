/* global */
'use strict';

var gulp = require('gulp'),
    jade = require('gulp-jade'),
    browserify = require('browserify'),
    vinylSource = require('vinyl-source-stream'),
    uglify = require('gulp-uglify'),
    streamify = require('gulp-streamify'),
    sass = require('gulp-sass'),
    less = require('gulp-less'),
    sourcemaps = require('gulp-sourcemaps'),
    connect = require('gulp-connect'),
    argv = require('optimist').argv,
    gulpif = require('gulp-if');

var outputDir = 'builds/development';

console.log ('argv: ', argv);

// var env = process.env.NODE_ENV || 'development';
var env = argv.env || 'development';
var port = argv.p || '9999';

// automatically set livereload port for additional instance
var livereload_port = (port !== '9999') ? (+port + 40000) + "" : '35729';

console.log('env: ', env);
console.log('livereload_port: ', livereload_port);

var doneInit = false;

gulp.task('initialize', function(cb) {
    // ref: https://github.com/gulpjs/gulp/blob/master/docs/recipes/running-tasks-in-series.md

    // task initalize only done once

    console.log('doneInit', doneInit );
    if (!doneInit) {
        var interval = setInterval(function() {
            console.log('initialize');
        }, 100)
        doneInit = true;

        setTimeout(function(){
            clearInterval(interval);
            console.log('done initialize');
            var err = null; // no error
            // if err is not null and not undefined, the orchestration will stop
            cb(err); // call cb to signal task initialize is done
        }, 3000)
    } else {
        var err = null; // no error
        cb(err)
    }
});

gulp.task('before', ['initialize'], function(cb) {
    // ref: https://github.com/gulpjs/gulp/blob/master/docs/recipes/running-tasks-in-series.md

    // do stuff -- async or otherwise
    // will run before task default

    var interval = setInterval(function() {
        console.log('working on task before');
    }, 100)

    setTimeout(function(){
        clearInterval(interval);
        console.log('done task before');
        var err = null; // no error
        // if err is not null and not undefined, the orchestration will stop
        cb(err); // call cb to signal task before is done
    }, 3000)

});


gulp.task('jade', ['before'], function(){
    return gulp.src('src/templates/**/*.jade')
    .pipe(jade({pretty: true}))
    .pipe(gulp.dest(outputDir))
    .pipe(connect.reload());
});


gulp.task('js', ['before'], function(){
    return browserify({
        entries: ['./src/js/main.js'],
        debug: env === 'development' // only include source map if NODE_ENV is set 'development'
    })
    .bundle()
    .pipe(vinylSource('app.js')) // <-
                    // Gulp work w vinyl-source-obj, it
                    // does not undestand browserify bundle directly.
                    // Thus, need vinyl-source-stream plugin to translate
                    // browserify output to what gulp stream understand
                    //       @Parameter: is the desire name
    // .pipe(uglify())          // << error because uglify does not support streaming.
                                //      Uglify require the entire content of the output to do its work.
                                //      Thus, we need to use gulp-streamify. Gulp-streamify
                                //      save entire stream output in a buffer bf calling uglify plugin.
    .pipe(
        gulpif( env === 'production', streamify(uglify())) // only uglify on production enviroment
     )
    .pipe(gulp.dest(outputDir))
    .pipe(connect.reload());
});


gulp.task('sass', ['before'], function(){
    var config = {};
    if (env === 'development') { config.writeSrcMap = true; }
    if (env === 'production') { config.writeSrcMap = false; }

    return gulp.src('src/sass/main.scss')
    .pipe(sourcemaps.init())   // <--- sourcemaps initialize
    .pipe(sass({errLogToConsole: true}))
    .pipe( gulpif( config.writeSrcMap, sourcemaps.write()))
    // .pipe( gulpif( false, sourcemaps.write()))
    .pipe(gulp.dest(outputDir))
    .pipe(connect.reload());
});



gulp.task('less', ['before'],  function(){
    var config = {};
    console.log('in task less, --env =', env);
    if (env === 'development') { config.writeSrcMap = true; }
    if (env === 'production') { config.writeSrcMap = false; }

    return gulp.src('src/less/main.less')
    .pipe( sourcemaps.init())   // <--- sourcemaps initialize
    .pipe(less())
    .on('error', function(err){
        //see //https://github.com/gulpjs/gulp/issues/259
        console.log(err);
        this.emit('end');
    })
    // NOTE: the following work too
    // .pipe(less().on('error', function(err){
    //     console.log(err);
    //     this.emit('end');
    // }))
    .pipe( gulpif( config.writeSrcMap, sourcemaps.write()))
    .pipe(gulp.dest(outputDir))
    .pipe(connect.reload());
});

gulp.task('watch', ['before'], function(){
    gulp.watch('src/templates/**/*.jade', ['jade']);
    gulp.watch('src/js/**/*.js', ['js']);
    // gulp.watch('src/sass/**/*.scss', ['sass']);
    gulp.watch('src/less/**/*.less', ['less']);
})

gulp.task('connect', ['before'], function(){
connect.server({
        root: outputDir,
        // open: { browser: 'Google Chrome'}
        // Option open does not work in gulp-connect v 2.*. Please read "readme" https://github.com/AveVlad/gulp-connect}
        port: port,
        // livereload: true,
        livereload: {port : livereload_port}
    });
});



// gulp.task('default', ['js', 'jade', 'sass', 'watch', 'connect']);
gulp.task('default', ['js', 'jade', 'less', 'watch', 'connect']);


