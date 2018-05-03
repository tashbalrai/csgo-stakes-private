var
  gulp = require('gulp'),
  babel = require('gulp-babel')
  watch = require('gulp-watch');

gulp.task('default', function () {
  gulp.src('./*.js')
    .pipe(babel())
    .pipe(gulp.dest('./../../dest/admin/'));

  gulp.src('./helpers/**/*.js')
    .pipe(babel())
    .pipe(gulp.dest('./../../dest/admin/helpers/'));

  gulp.src('./config/**/*.js')
    .pipe(babel())
    .pipe(gulp.dest('./../../dest/admin/config/'));
  
  gulp.src('./http/**/*.js')
    .pipe(babel())
    .pipe(gulp.dest('./../../dest/admin/http/'));

  gulp.src('./socket/**/*.js')
    .pipe(babel())
    .pipe(gulp.dest('./../../dest/admin/socket/'));

  gulp.src('./views/**/*.ejs')
    .pipe(gulp.dest('./../../dest/admin/views/'));
});

gulp.task('public', function () {
  gulp.src('./public/**/*.*')
    .pipe(gulp.dest('./../../dest/admin/public/'));
});

var watcher = gulp.watch('./**/*.*', ['default']);
watcher.on('change', ev => {
  console.log('File', ev.path, 'has', ev.type);
});