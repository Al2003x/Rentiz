import gulp from "gulp";
import plumber from "gulp-plumber";
import sass from "gulp-dart-sass";
import postcss from "gulp-postcss";
import autoprefixer from "autoprefixer";
import csso from "postcss-csso";
import rename from "gulp-rename";
import htmlmin from "gulp-htmlmin";
import fileInclude from "gulp-file-include";
import terser from "gulp-terser";
import squoosh from "gulp-libsquoosh";
import svgo from "gulp-svgmin";
import svgstore from "gulp-svgstore";
import del from "del";
import browser from "browser-sync";
import cheerio from "gulp-cheerio";

// Styles

const styles = () => {
  return gulp
    .src("src/sass/style.scss", { sourcemaps: true })
    .pipe(plumber())
    .pipe(sass().on("error", sass.logError))
    .pipe(postcss([autoprefixer(), csso()]))
    .pipe(rename("style.min.css"))
    .pipe(gulp.dest("build/css", { sourcemaps: "." }))
    .pipe(browser.stream());
};

// HTML

const htmlInclude = () => {
  return gulp.src("src/*.html")
  .pipe(fileInclude({
    prefix: '@',
    basepath: '@file'
  }))
  .pipe(gulp.dest("build"))
  .pipe(browser.stream());
};

const htmlMinify = () => {
  return gulp.src("build/**/*.html")
    .pipe(htmlmin({
      collapseWhitespace: true
    }))
    .pipe(gulp.dest("build"))
    .pipe(browser.stream())
}

// Scripts

const scripts = () => {
  return gulp
    .src("src/js/script.js")
    .pipe(terser( ))
    .pipe(gulp.dest("build/js"))
    .pipe(browser.stream());
};

// Images

const optimizeImages = () => {
  return gulp
    .src("src/img/**/*.{png,jpg}")
    .pipe(squoosh())
    .pipe(gulp.dest("build/img"));
};

const copyImages = () => {
  return gulp.src("src/img/**/*.{png,jpg}").pipe(gulp.dest("build/img"));
};

// WebP

const createWebp = () => {
  return gulp
    .src("src/img/**/*.{png,jpg}")
    .pipe(
      squoosh({
        webp: {},
        avif: {},
      })
    )
    .pipe(gulp.dest("build/img"));
};

// SVG

const svg = () =>
  gulp
    .src(["src/img/*.svg", "!src/img/icons/*.svg"])
    .pipe(svgo())
    .pipe(gulp.dest("build/img"));

const sprite = () => {
  return gulp
    .src("src/img/icons/*.svg")
    .pipe(cheerio({
      run: function($) {
        $('[fill]').removeAttr('fill');
        $('[stroke]').removeAttr('stroke');
        $('[style]').removeAttr('style');
      },
      parserOptions: {
        xmlMode: true
      },
    }))
    .pipe(svgo())
    .pipe(
      svgstore({
        inlineSvg: true,
      })
    )
    .pipe(rename("sprite.svg"))
    .pipe(gulp.dest("build/img"));
};

// Copy

const copy = (done) => {
  gulp
    .src(["src/fonts/*.{woff2,woff}", "src/*.ico"], {
      base: "src",
    })
    .pipe(gulp.dest("build"));
  done();
};

// Clean

const clean = () => {
  return del("build");
};

// Server

const server = (done) => {
  browser.init({
    server: {
      baseDir: "build",
    },
    cors: true,
    notify: false,
    ui: false,
  });
  done();
};

// Reload

const reload = (done) => {
  browser.reload();
  done();
};

// Watcher

const watcher = () => {
  gulp.watch("src/sass/**/*.scss", gulp.series(styles));
  gulp.watch("src/js/script.js", gulp.series(scripts));
  gulp.watch("src/*.html", gulp.series(htmlInclude, reload));
  gulp.watch("src/partials/*.html", gulp.series(htmlInclude, reload));
};

// Build

export const build = gulp.series(
  clean,
  copy,
  // optimizeImages,
  htmlInclude,
  gulp.parallel(styles, htmlMinify, scripts, svg, sprite, createWebp)
);

// Default

export default gulp.series(
  clean,
  copy,
  copyImages,
  gulp.parallel(styles, htmlInclude, scripts, svg, sprite, createWebp),
  gulp.series(server, watcher)
);
