module.exports = function(grunt) {

	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		concat: {
			dist: {
				src: [
				'src/class.js', 
				'src/events.js', 
				'src/model.js',
				'src/collection.js',
				'src/observable.js',
				'src/viewmodel.js',
				'src/binds_bank.js'
				],
				dest: 'bin/frontbone.js'
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
			files: ['src/*.js'],
			tasks: ['default']
		}
	});

	// Load the plugin that provides the "uglify" task.
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-watch');

	// Default task(s).
	grunt.registerTask('default', ['concat', 'uglify']);
	grunt.registerTask('watch', ['watch']);
	

};
/*
module.exports = function(grunt) {
	var version='1.1.0';
	// Project configuration.
	grunt.initConfig({
		concat: {
			dist: {
				src: [
				'src/class.js', 
				'src/events.js', 
				'src/model.js',
				'src/collection.js',
				'src/observable.js',
				'src/viewmodel.js',
				'src/binds_bank.js'
				],
				dest: 'bin/frontbone.js'
			}
		},
		min: {
			dist: {
				src: ['bin/frontbone.js'],
				dest: 'bin/frontbone.min.js'
			}
		},
		watch: {
			files: '[src/*.js]',
			tasks: ['default']
		}
		
	});
	//grunt.loadNpmTasks('grunt-contrib-watch');
	// Default task.
	grunt.registerTask('default', ['concat','min']);
	
};*/