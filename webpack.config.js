const path = require("path");
const TerserPlugin = require("terser-webpack-plugin");

const resolve = (dir) => path.resolve(__dirname, dir);

const webpackConfig = {
	devtool: "source-map",
	mode: "production",
	entry: "./src/index.js",
	output: {
		path: resolve("./dist"),
		filename: "cl-crud2.min.js",
		libraryTarget: "umd"
	},
	module: {
		rules: [
			{
				test: /\.js$/,
				loader: "babel-loader",
				exclude: /node_modules/
			},
			{
				test: /\.styl$/,
				loaders: ["style-loader", "css-loader", "stylus-loader"]
			}
		]
	},
	resolve: {
		alias: {
			"@": resolve("src")
		}
	},
	optimization: {
		minimize: true,
		minimizer: [
			new TerserPlugin({
				sourceMap: true
			})
		]
	}
};

module.exports = webpackConfig;
