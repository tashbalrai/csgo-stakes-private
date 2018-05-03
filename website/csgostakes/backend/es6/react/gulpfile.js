var
  gulp = require('gulp'),
  babel = require('gulp-babel')
  watch = require('gulp-watch');

gulp.task('default', function () {
  gulp.src('./config/**/*.js')
    .pipe(babel())
    .pipe(gulp.dest('./../../dest/react/config/'));
  
  gulp.src('./http/**/*.js')
    .pipe(babel())
    .pipe(gulp.dest('./../../dest/react/http/'));
  
  gulp.src('./*.js')
    .pipe(babel())
    .pipe(gulp.dest('./../../dest/react/'));

  gulp.src('./views/**/*.*')
    .pipe(gulp.dest('./../../dest/react/views/'));
  
  gulp.src('./public/**/*.*')
    .pipe(gulp.dest('./../../dest/react/public/'));
});

var watcher = gulp.watch('./**/*.*', ['default']);
watcher.on('change', ev => {
  console.log('File', ev.path, 'has', ev.type);
});