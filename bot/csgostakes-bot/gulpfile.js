var
  gulp = require('gulp'),
  babel = require('gulp-babel')
  watch = require('gulp-watch');

gulp.task('default', function () {
  return gulp.src('./es6/**/*.js')
    .pipe(babel())
    .pipe(gulp.dest('./dest/'));
});

var watcherBase = gulp.watch('./es6/**/*.js', ['default']);
watcherBase.on('change', ev => {
  console.log('File', ev.path, 'has', ev.type);
});