const fs = require('fs');
const del = require('del');
const rollup = require('rollup');
const babel = require('rollup-plugin-babel');
const uglify = require('rollup-plugin-uglify');
const pkg = require('../package.json');

const babelPresetEnv = {
  es: ['stage-0'],
  cjs: [
    ['env', { modules: false, targets: { node: 6 } }],
    'stage-0'
  ],
  browser: [
    ['env', { modules: false, targets: { browsers: ['last 2 versions', 'safari >= 7'] } }],
    'stage-0'
  ],
  umd: [
    ['env', { modules: false }],
    'stage-0'
  ],
};

const bundles = [
  {
    format: 'cjs',
    ext: '.js',
    plugins: [],
    babelPresets: babelPresetEnv.cjs,
    babelPlugins: []
  },
  {
    format: 'es',
    ext: '.es.js',
    plugins: [],
    babelPresets: babelPresetEnv.es,
    babelPlugins: []
  },
  {
    format: 'cjs',
    ext: '.browser.js',
    plugins: [],
    babelPresets: babelPresetEnv.browser,
    babelPlugins: []
  },
  {
    format: 'umd',
    ext: '.js',
    filename: 'minska',
    plugins: [],
    babelPresets: babelPresetEnv.umd,
    babelPlugins: [],
    moduleName: 'Minska'
  },
  {
    format: 'umd',
    ext: '.min.js',
    filename: 'minska',
    plugins: [uglify()],
    babelPresets: babelPresetEnv.umd,
    babelPlugins: [],
    moduleName: 'Minska',
    minify: true
  }
];

let promise = Promise.resolve();

// Clean up the output directory
promise = promise.then(() => del(['dist/*']));

// Compile source code into a distributable format with Babel and Rollup
for (const config of bundles) {
  promise = promise.then(() => rollup.rollup({
    entry: 'src/index.js',
    external: Object.keys(pkg.dependencies),
    plugins: [
      babel({
        babelrc: false,
        exclude: 'node_modules/**',
        presets: config.babelPresets,
        plugins: config.babelPlugins
      })
    ].concat(config.plugins),
  }).then(bundle => bundle.write({
    dest: `dist/${config.filename || 'index'}${config.ext}`,
    format: config.format,
    sourceMap: !config.minify,
    moduleName: config.moduleName,
  })));
}

// Copy package.json, README.md, and CHANGELOG.md
promise = promise.then(() => {
  delete pkg.private;
  delete pkg.devDependencies;
  delete pkg.scripts;
  delete pkg.jest;
  fs.writeFileSync('dist/package.json', JSON.stringify(pkg, null, '  '), 'utf-8');
  fs.writeFileSync('dist/README.md', fs.readFileSync('README.md', 'utf-8'), 'utf-8');
  fs.writeFileSync('dist/CHANGELOG.md', fs.readFileSync('CHANGELOG.md', 'utf-8'), 'utf-8');
});

promise.catch(err => console.error(err.stack)); // eslint-disable-line no-console
