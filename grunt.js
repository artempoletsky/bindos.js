module.exports = function(grunt) {
	var version='0.9.5';
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