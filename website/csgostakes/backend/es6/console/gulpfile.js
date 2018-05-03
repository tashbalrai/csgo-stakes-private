var
  gulp = require('gulp'),
  babel = require('gulp-babel')
  watch = require('gulp-watch');

gulp.task('default', function () {
  return gulp.src('./**/*.js')
    .pipe(babel())
    .pipe(gulp.dest('./../../dest/console/'));
});

var watcher = gulp.watch('./**/*.js', ['default']);
watcher.on('change', ev => {
  console.log('File', ev.path, 'has', ev.type);
});



