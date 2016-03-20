var path = require('path');

const PATHS = {
    src: path.join(__dirname, 'src'),
    dist: path.join(__dirname, 'dist')
};

module.exports = {
	entry: PATHS.src,
	output: {
		path: PATHS.dist,
		filename: 'bundle.js'
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