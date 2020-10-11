import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import pkg from './package.json';
import autoprefixer from 'autoprefixer';
import postcss from 'rollup-plugin-postcss';

export default [
	{
		inlineDynamicImports: true,
		input: './src/index.js',
		output: [
			{
				file: './lib/index.js',
				globals: { react: 'React' },
				format: 'cjs'
			}
		],
		external: [...Object.keys(pkg.dependencies || {})],
		plugins: [
			commonjs(),
			resolve(),
			postcss({
				plugins: [autoprefixer()],
				sourceMap: true,
				extract: false,
				minimize: true
			}),
			babel({exclude: 'node_modules/**'})
		]
	}
];