'use strict';
var gulp = require('gulp');
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');

gulp.task('sass', function () {
    gulp.src('./scss/**/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(autoprefixer({
	    browsers: ['>1%']
	}))
        .pipe(gulp.dest('./static/css'));
});

gulp.task('sass:watch', function () {
    gulp.watch('./scss/**/*.scss', ['sass']);
    gulp.run('sass');
});

