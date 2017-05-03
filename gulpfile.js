// 引入gulp  
var gulp = require('gulp');  
  
// 引入组件
var sass = require('gulp-sass');                  // sass编译
var concat = require('gulp-concat');              // 合并
var cleanCss = require('gulp-clean-css');         // css压缩
var autoprefixer = require('gulp-autoprefixer');  // 自动补全前缀

// sass编译
gulp.task('sass', function () {
    gulp.src('./sass/**/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(cleanCss({conpatibility: 'ie8'})) // 进行压缩
        .pipe(concat("index.css")) // 合并  
        .pipe(autoprefixer({
            browsers: ['last 2 versions', 'Android >= 4.0'],
            cascade: true, // 是否美化属性值 默认：true
            remove: true // 是否去掉不必要的前缀 默认：true
        }))
        .pipe(gulp.dest('./'));
});

gulp.task('dev', function() {
    watch('./sass/**/*.scss', ['sass']);
});

function watch(src, tasks) {
    var watcher = gulp.watch(src, tasks);
    watcher.on('change', function(event) {
      console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
    });
}