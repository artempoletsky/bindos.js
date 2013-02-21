module.exports = function(grunt) {
	grunt.initConfig({
		watch: {
			files: '**/*',
			tasks: ['jshint']
		}
	})
	
	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		concat: {
			dist: {
				src: ['src/observable.js'
				,'src/class.js'
				,'src/events.js'
				,'src/model.js'
				,'src/collection.js'
				,'src/viewmodel.js'
				,'src/binds_bank.js'
				],
				dest: 'bin/<%= pkg.name %>.js'
			}
		},
		uglify: {
			options: {
				banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
			},
			build: {
				src: 'bin/<%= pkg.name %>.js',
				dest: 'bin/<%= pkg.name %>.min.js'
			}
		},
		watch: {
			scripts: {
				files: 'src/*.js',
				tasks: ['jasmine', 'build'],
				options: {
					debounceDelay: 250
				}
			}
		},
		jasmine: {
			pivotal: {
				src: ['lib/lodash.min.js'
				,'lib/jquery-1.8.2.js'
				,'src/observable.js'
				,'src/class.js'
				,'src/events.js'
				,'src/model.js'
				,'src/collection.js'
				,'src/viewmodel.js'
				,'src/binds_bank.js'
				],
				options: {
					specs: ['spec/*test.js','!spec/viewmodel.test.js'],
					helpers: 'spec/*Helper.js'
				}
			}
		}
	});

	
	grunt.loadNpmTasks('grunt-contrib-jasmine');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-watch');

	
	grunt.registerTask('build', ['concat', 'uglify']);
	

};