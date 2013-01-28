module.exports = function(grunt) {
	// Project configuration.
	grunt.initConfig({
		concat: {
			dist: {
				src: [
					'src/js/class.js', 
					'src/js/events.js', 
					'src/js/model.js',
					'src/js/collection.js',
					'src/js/observable.js',
					'src/js/viewmodel.js',
					'src/js/binds_bank.js'
				],
				dest: 'bin/frontbone-0.9.0.js'
			}
		}
	});
	// Default task.
	grunt.registerTask('default', 'concat');
};