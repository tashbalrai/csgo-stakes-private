var
  gulp = require('gulp'),
  babel = require('gulp-babel')
  clean = require('gulp-rimraf'),
  watch = require('gulp-watch');

gulp.task('clean', [], function() {
  console.log("Clean all files in build folder");

  return gulp.src("./dest/*", { read: false }).pipe(clean());
});

gulp.task('base', ['clean', 'view', 'static'], function () {
  return gulp.src('./es6/**/*.js')
    .pipe(babel())
    .pipe(gulp.dest('./dest/'));
});

gulp.task('view', function () {
  return gulp.src('./es6/react/views/**/*')
    .pipe(gulp.dest('./dest/react/views/'));
});

gulp.task('static', function () {
  return gulp.src(['../build/**/*', '!../build/**/*.html'])
    .pipe(gulp.dest('./dest/react/public'));
});
//
// var watcherBase = gulp.watch('./es6/**/*.js', ['base']);
// watcherBase.on('change', ev => {
//   console.log('File', ev.path, 'has', ev.type);
// });