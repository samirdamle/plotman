/* import merge from 'deepmerge'
import { createBasicConfig } from '@open-wc/building-rollup'

const baseConfig = createBasicConfig()

export default merge(baseConfig, {
    input: './out-tsc/src/index.js',
    output: {
        dir: 'dist',
    },
}) */

/* import typescript from 'rollup-plugin-typescript2'
import { terser } from 'rollup-plugin-terser'

export default {
    input: 'src/index.ts',
    output: [
        {
            name: 'plotman',
            file: 'dist/index.js',
            format: 'cjs',
        },
    ],
    // plugins: [typescript(), terser()],
    plugins: [typescript()],
} */

import commonjs from 'rollup-plugin-commonjs'
import external from 'rollup-plugin-peer-deps-external'
import resolve from 'rollup-plugin-node-resolve'
import { terser } from 'rollup-plugin-terser'
import typescript from 'rollup-plugin-typescript2'
import url from 'rollup-plugin-url'

import pkg from './package.json'

export default {
    input: 'src/index.ts',
    output: [
        {
            file: pkg.main,
            format: 'cjs',
            exports: 'named',
            sourcemap: true,
        },
        {
            file: pkg.module,
            format: 'es',
            exports: 'named',
            sourcemap: true,
        },
    ],
    plugins: [
        external(),
        url({ exclude: ['**/*.svg'] }),
        resolve(),
        typescript({
            rollupCommonJSResolveHack: true,
            clean: true,
        }),
        commonjs(),
        terser(),
    ],
}
