var
  gulp = require('gulp'),
  babel = require('gulp-babel')
  watch = require('gulp-watch');

gulp.task('default', function () {
  gulp.src('./config/*.js')
    .pipe(babel())
    .pipe(gulp.dest('./../dest/config/'));
  
    gulp.src('./*.json')
    .pipe(gulp.dest('./../dest/'));

  return gulp.src('./*.js')
    .pipe(babel())
    .pipe(gulp.dest('./../dest/'));
});

var watcher = gulp.watch('./*.js', ['default']);
watcher.on('change', ev => {
  console.log('File', ev.path, 'has', ev.type);
});

var watcher2 = gulp.watch('./config/*.js', ['default']);
watcher2.on('change', ev => {
  console.log('File', ev.path, 'has', ev.type);
});



