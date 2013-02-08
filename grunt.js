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
		}
	});
	// Default task.
	grunt.registerTask('default', 'concat min');
};