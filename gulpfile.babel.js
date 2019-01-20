import del from "del";
import fs from "fs";
import gulp from "gulp";
import babel from "gulp-babel";
import eslint from "gulp-eslint";
import ext from "gulp-ext-replace";
import jscc from "gulp-jscc";
import uglify from "gulp-uglify";

import { rollup } from "rollup";

const eslintConfig = {
  "parser": "babel-eslint",
  "plugins": ["flowtype"],
  "rules": {
    "comma-dangle": [2, "always-multiline"],
    "semi": 2,
    "no-unexpected-multiline": 1,
    "no-underscore-dangle": 0,
    "space-infix-ops": 0,
    "no-multi-spaces": 0,
    "no-unused-vars": 1,
    "comma-spacing": 1,
    "no-use-before-define": 0,
    "eol-last": 0,
    "no-extra-semi": 0,
    "curly": 0,
    "dot-notation": 0,
    "no-shadow": 1,
    "no-proto": 0,
    "flowtype/boolean-style": [2, "boolean"],
    "flowtype/define-flow-type": 1,
    "flowtype/delimiter-dangle": [2, "always-multiline"],
    "flowtype/generic-spacing": [2, "never"],
    "flowtype/no-dupe-keys": 2,
    "flowtype/no-primitive-constructor-types": 2,
    "flowtype/no-types-missing-file-annotation": 0,
    "flowtype/no-unused-expressions": 2,
    "flowtype/no-weak-types": 2,
    "flowtype/object-type-delimiter": "comma",
    "flowtype/require-parameter-type": 0,
    "flowtype/require-return-type": 0,
    "flowtype/require-valid-file-annotation": [
      2,
      "always",
      {"annotationStyle": "block"},
    ],
    "flowtype/semi": 2,
    "flowtype/space-after-type-colon": [2, "always"],
    "flowtype/space-before-generic-bracket": [2, "never"],
    "flowtype/space-before-type-colon": [2, "never"],
    "flowtype/union-intersection-spacing": [2, "always"],
    "flowtype/use-flow-type": 1, //TODO: What the hell does this do?
  },
  "settings": {
    "flowtype": {"onlyFilesWithFlowAnnotation": false},
  },
};


// `clean` task

export function clean() {
  return del([
    "browser/",
    "lib/",
    "test/testing.capnp.js",
    "test/errors.out",
    "test/errors.diff",
  ], {force: true});
}


// Browser subtasks

function browserLib() {
  const presets = [["@babel/preset-env", {forceAllTransforms: true, modules: false}]];

  return gulp.src("src/**/*.js")
    .pipe(eslint(eslintConfig))
    .pipe(eslint.format())
    .pipe(eslint.failAfterError())
    .pipe(jscc({ values: { _DEBUG: process.env.DEBUG } }))
    .pipe(babel({plugins: ["@babel/transform-flow-strip-types"], presets}))
    .pipe(gulp.dest("browser/lib"));
}

function browserRollup() {
  return rollup({
    input: "browser/lib/index.js",
    external: [
      "@capnp-js/data-read",
      "@capnp-js/data-write",
      "@capnp-js/int64",
      "@capnp-js/uint64",
    ],
  }).then(bundle => {
    bundle.write({
      file: "browser/capnp-js-core.js",
      format: "umd",
      name: "capnpJsCore",
      sourcemap: true,
      globals: {
        "@capnp-js/data-read": "capnpJsDataRead",
        "@capnp-js/data-write": "capnpJsDataWrite",
        "@capnp-js/int64": "capnpJsInt64",
        "@capnp-js/uint64": "capnpJsUint64",
      },
    });
  });
}

function browserUglify() {
  return new Promise((resolve, reject) => {
    fs.readFile("browser/capnp-js-core.js.map", (err, map) => {
      if (err) {
        reject(err);
      } else {
        const ugly = gulp.src("browser/capnp-js-core.js")
          .pipe(uglify({
            sourceMap: {
              content: map.toString(),
              url: "capnp-js-core.js.map",
            },
          }))
          .pipe(gulp.dest("browser"));
        resolve(ugly);
      }
    });
  });
}

const browser = gulp.series(browserLib, browserRollup, browserUglify);


// CommonJS subtasks

function cjsLib() {
  const presets = [["@babel/preset-env", {targets: {node: "8.9"}, modules: "commonjs"}]];

  return gulp.src("src/**/*.js")
    .pipe(eslint(eslintConfig))
    .pipe(eslint.format())
    .pipe(eslint.failAfterError())
    .pipe(jscc({ values: { _DEBUG: process.env.DEBUG } }))
    .pipe(babel({plugins: ["@babel/transform-flow-strip-types"], presets}))
    .pipe(gulp.dest("lib"));
}

function cjsFlowLib() {
  return gulp.src("src/**/*.js")
    .pipe(jscc({ values: { _DEBUG: process.env.DEBUG } }))
    .pipe(ext(".js.flow"))
    .pipe(gulp.dest("lib"));
}

const cjs = gulp.parallel(cjsLib, cjsFlowLib);


// `build` task

gulp.task("build", gulp.parallel(browser, cjs));


export function convertTestSchema(cb) {
  const cgr = spawn("capnp", [
    "compile",
    "-ojs:test",
    "--src-prefix=test",
    "test/testing.capnp"
  ]);

  cgr.on("close", function (code) {
    if (code !== 0) {
      throw new Error("Schema build failed with code " + code);
    } else {
      cb();
    }
  });
}
