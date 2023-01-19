// rollup.config.js
import babel from 'rollup-plugin-babel';
import { terser } from 'rollup-plugin-terser';
import pkg from './package.json' assert { type: "json" };
const { module, main, unpkg } = pkg;

export default {
    input: module,
    plugins: [
        babel() // convert to ES5
    ],
    output: [
        {
            file: main,
            name: 'stringEncode',
            format: 'umd',
            sourcemap: true,
        },
        {
            file: unpkg,
            name: 'stringEncode',
            format: 'umd',
            sourcemap: true,
            plugins: [
                terser(), // minify JS/ES
            ],
        },
    ]
};
