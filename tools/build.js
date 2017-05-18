/**
 * inferno-firebase
 *
 * Copyright © 2017 Magnus Bergman <hello@magnus.sexy>. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const fs = require('fs');
const del = require('del');
const rollup = require('rollup');
const babel = require('rollup-plugin-babel');
const pkg = require('../package.json');

let promise = Promise.resolve();

promise = promise.then(() => del(['dist/*']));

['es', 'cjs', 'umd'].forEach(format => {
  promise = promise.then(() =>
    rollup
      .rollup({
        entry: 'src/index.js',
        external: [].concat(
          Object.keys(pkg.dependencies),
          Object.keys(pkg.peerDependencies)
        ),
        plugins: [
          babel(
            Object.assign(pkg.babel, {
              babelrc: false,
              exclude: 'node_modules/**',
              runtimeHelpers: true,
              presets: pkg.babel.presets.map(
                x =>
                  x === 'env' ? ['env', { modules: false, loose: true }] : x
              ),
            })
          ),
        ],
      })
      .then(bundle =>
        bundle.write({
          dest: `dist/${format === 'cjs' ? 'index' : `index.${format}`}.js`,
          format,
          sourceMap: true,
          moduleName: format === 'umd' ? pkg.name : undefined,
        })
      )
  );
});

promise = promise.then(() => {
  delete pkg.private;
  delete pkg.devDependencies;
  delete pkg.scripts;
  delete pkg.babel;
  delete pkg.prettierOptions;
  delete pkg['lint-staged'];
  fs.writeFileSync(
    'dist/package.json',
    JSON.stringify(pkg, null, '  '),
    'utf-8'
  );
  fs.writeFileSync(
    'dist/LICENSE',
    fs.readFileSync('LICENSE', 'utf-8'),
    'utf-8'
  );
});

promise.catch(err => console.error(err.stack)); // eslint-disable-line no-console
