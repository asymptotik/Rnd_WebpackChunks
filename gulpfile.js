/* global require, actors */

/**
 *
 *  Web Starter Kit
 *  Copyright 2014 Pixmoto Inc. All rights reserved.
 *
 */

'use strict';

// Include Gulp & tools we'll use

var browserSync = require('browser-sync').create();
var del = require('del');
var fs = require('fs');
var gulp = require('gulp-help')(require('gulp'));
var $ = require('gulp-load-plugins')();
var logger = require('winston');
var path = require('path');
var runSequence = require('run-sequence');
var webpack = require('webpack');
var BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
var reload = browserSync.reload;

var ENV_HELP = 'Environment to target';

function isMinimized() {
	return false;
}

function webpackOptions() {

	var plugins = [];

	var webpack_options = {
		entry : {
			index:'./app/js/index.js'
		},
		module: {
		  	rules: [
				{
					test: /\.js$/,
					exclude: /(node_modules|bower_components)/,
					use: [
						{
							loader: 'babel-loader',
							query: {
      							presets: ['es2015', 'stage-0', 'react'],
      							plugins: ['transform-runtime']
    						}
    					}
    				]	
				}
			],
		},
		devtool: 'cheap-module-source-map',
		plugins: [
			new BundleAnalyzerPlugin({
				analyzerMode: 'static',
				reportFilename: 'report.html',
				openAnalyzer: true
			}),
			new webpack.optimize.CommonsChunkPlugin({
		    	async: 'common',
		        children: true,
		        minChunks: 2,
		        minSize: 0

		    })
		],
		cache: true,
		output: {
			path: path.resolve(__dirname, 'dist'),
			filename: '[name]-bundle.js',
			chunkFilename: '[name]-chunk.js'
		}
	};

	return webpack_options;
}

function logStats(name, stats) {
	$.util.log(name, stats.toString({
	    cached: true,
	    cachedAssets: false
    }));
}

// Lint JavaScript
gulp.task('eslint', 'Runs eslint over javascript', function() {
	return gulp.src(['app/**/*.js', '!app/js/lib/**/*.js'])
		//.pipe(reload({
		//	stream: true,
		//	once: true
		//}))
        // eslint() attaches the lint output to the "eslint" property
        // of the file object so it can be used by other modules.
        .pipe($.eslint())
        // eslint.format() outputs the lint results to the console.
        // Alternatively use eslint.formatEach() (see Docs).
        .pipe($.eslint.format())
        // To have the process exit with an error code (1) on
        // lint error, return the stream and pipe to failAfterError last.
        .pipe($.eslint.failAfterError());
});

// Optimize images
gulp.task('dist_images', 'Optimizes images', function() {
	return gulp.src('app/img/**/*')
		.pipe($.cache($.imagemin({
			progressive: true,
			interlaced: true
		})))
		.pipe(gulp.dest('dist/img'))
		.pipe($.size({
			title: 'dist_images'
		}));
});

// Copy all files at the root level (app)
gulp.task('dist_root', 'Copy all files at the root level (app)', function() {

	// We only want files, so we have to ignoire directories.
	var root = 'app';
	var dirs = fs.readdirSync(root).filter(function(file) {
		return fs.statSync(path.join(root, file)).isDirectory();
	});
	var src = ['app/*', '!app/*.php'];
	for (var i = 0; i < dirs.length; i++) {
		src.push('!app/' + dirs[i] + '{,/**}');
	}
	return gulp.src(src, {
			dot: true
		})
		.pipe(gulp.dest('dist'))
		.pipe($.size({
			title: 'dist_root'
		}));
});

// Copy web fonts to dist
gulp.task('dist_fonts', 'Copy web fonts to dist', function() {
	return gulp.src(['app/font/**'])
		.pipe(gulp.dest('dist/font'))
		.pipe($.size({
			title: 'dist_font'
		}));
});

gulp.task('dist_html', 'Compile javascript', function() {

	return gulp
		.src(['app/**/*.html', '!app/test/**/*.html', '!app/js/lib/jasmine/**/*.html'])
		.pipe(gulp.dest('dist'))
		.pipe($.size({
			title: 'dist_html'
		}));
});

gulp.task('dist_js', 'Build js', function(callback) {
	webpack(
		webpackOptions(), 
		function(err, stats) {
	        if(err) throw new $.util.PluginError("webpack", err);
	        logStats("[webpack dist_js]", stats);
        	callback();
    	}
    );
});

gulp.task('dist_svg', 'Build svg sprites', function() {
	return createSvgTask('dist_svg', '**/*.svg', {
		cwd: 'app/svg'
	}, 'sprites', 'dist', 'svg/', 'svg/');
});

// Build svg into tmp dir
gulp.task('build_svg', 'Build svg sprites', function() {

	return createSvgTask('computer_tmpl', '**/*.svg', {
		cwd: 'app/svg'
	}, 'sprites', '.tmp', '', '');
});

gulp.task('dist_svg', 'Build svg sprites', ['build_svg'], function() {

	return gulp.src('app/**/*.svg')
		.pipe(gulp.dest('dist'))
		.pipe($.size({
			title: 'dist_svg'
		}));;
});

gulp.task('dist_sass', 'Build svg sprites', function() {
	return createSassTask('dist_sass', ['sass/**/*.scss', '!sass/**/_*.scss', 'css_to_sass'], {
		cwd: 'app'
	}, ['.tmp/tmpl', 'app/scss', '.tmp/js/lib', 'node_modules', 'node_modules/video.js'], 'dist');
});

function createSvgTask(name, src, cwd, filename, dest, svg_dest, css_dest) {
	var config = {
		log: 'none',
		shape: {
			dimension: { // Set maximum dimensions 
				//maxWidth    : 16,
				//maxHeight   : 16,
				attributes: true,
			},
			spacing: { // Add padding 
				padding: 1
			},
			id: {
				generator: function(name) {
					var basename = path.basename(name, '.svg').replace(/_/g, '-');
					return 'icon-' + basename;
				}
			}
			//dest            : svg_dest + 'intermediate-svg'    // Keep the intermediate files 
		},
		mode: {
			symbol: {
				dest: '.',
				prefix: '.%s',
				dimensions: '-d',
				sprite: svg_dest + filename + '.svg',
				bust: false,
				example: {
					dest: svg_dest + filename + '.html'
				},
				render: {
					scss: {
						dest: css_dest + filename + '.scss'
					}
				}
			}
		},
		svg                     : {                         // General options for created SVG files
        	xmlDeclaration      : false,                    // Add XML declaration to SVG sprite
        	doctypeDeclaration  : false,                    // Add DOCTYPE declaration to SVG sprite
        	namespaceIDs        : true,                     // Add namespace token to all IDs in SVG shapes
        	dimensionAttributes : true                      // Width and height attributes on the sprite
    	},
	};

	return gulp.src(src, cwd)
		.pipe($.svgSprite(config))
		.pipe(gulp.dest(dest))
		.pipe($.size({
			title: 'dist_svg_' + name
		}));
}

function createSassTask(name, src, cwd, include, dest) {
	logger.info("dest: " + dest);
	return gulp.src(src, cwd)
		.pipe($.sass({
			includePaths: include
		}).on('error', $.sass.logError))
		.pipe($.if(isMinimized(), $.csso()))
		.pipe(gulp.dest(dest))
		.pipe($.size({
			title: 'dist_sass_' + name
		}));
}

function watchEverthing() {

	gulp.watch(['app/*', 'app/.*', '!app/*.html'], ['dist_root'], reload);
	gulp.watch(['app/**/*.html', '!app/tmpl/**/*.html'], ['dist_html'], reload);
	gulp.watch(['app/scss/**/*.scss'], ['dist_sass'], reload);
	gulp.watch(['app/js/**/*.js'], ['eslint', 'dist_js'], reload);
	gulp.watch(['app/svg/**/*.svg'], ['dist_svg'], reload);
	gulp.watch(['app/img/**/*'], ['dist_images'], reload);
	gulp.watch(['app/font/**/*'], ['dist_fonts'], reload);
}


// Clean output directory
gulp.task('clean', 'Clean output directory', del.bind(null, ['.tmp', 'dist/*', '!dist/.git'], {
	dot: true
}));

// Watch files for changes & reload
gulp.task('server', 'Watch files for changes & reload', ['default'], function () {
    browserSync.init({
        logLevel: 'info',
        logPrefix: 'dist',
        port: 8002,
        open: true,
        startPath: '/',
        notify: false,
        browser: 'google chrome'
    });

    watchEverthing();
});

// Build production files, the default task
gulp.task('default', 'Build distributable bundle, the default task', ['clean'], function(cb) {
	runSequence(['eslint',
		'dist_html',
		'dist_js',
		'dist_sass',
		'dist_images',
		'dist_fonts',
		'dist_svg',
		'dist_root'
	], cb);
}, {
	options: {
		'env=[dev | test | stage | prod]': ENV_HELP
	}
});
