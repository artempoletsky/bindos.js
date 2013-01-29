module.exports = function(grunt) {
	var version='0.9.1';
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
				dest: 'bin/frontbone-'+version+'.js'
			}
		},
		min: {
			dist: {
				src: ['bin/frontbone-'+version+'.js'],
				dest: 'bin/frontbone-'+version+'.min.js'
			}
		}
	});
	// Default task.
	grunt.registerTask('default', 'concat min');
};