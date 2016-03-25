var path = require('path');

const PATHS = {
    src: path.join(__dirname, 'src'),
    dist: path.join(__dirname, 'dist')
};

module.exports = {
	entry: PATHS.src,
	output: {
		path: __dirname,
		filename: 'dist/bundle.js'
	},
	module: {
		loaders: [
			{
				test: /.js$/,
				loader: 'babel-loader',
				exclude: /node_modules/,
				query: {
					presets: ['es2015']
				}
			}
		]
	}	
};