module.exports = function (grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            dist: {
                src: ['src/observable.js'
                    , 'src/class.js'
                    , 'src/events.js'
                    , 'src/model.js'
                    , 'src/collection.js'
                    , 'src/viewmodel.js'
                    , 'src/binds_bank.js'
                    , 'src/templates.js'
                    , 'src/eachmodel.js'
                    , 'src/router.js'
                    , 'src/history.js'
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
                tasks: ['build'],
                options: {
                    debounceDelay: 250
                }
            }
        },
        jasmine: {
            pivotal: {
                src: ['lib/lodash.min.js'
                    , 'lib/jquery-1.8.2.js'
                    , 'src/observable.js'
                    , 'src/class.js'
                    , 'src/events.js'
                    , 'src/model.js'
                    , 'src/collection.js'
                    , 'src/viewmodel.js'
                    , 'src/binds_bank.js'
                    , 'src/templates.js'
                    , 'src/eachmodel.js'
                ],
                options: {
                    specs: ['spec/*test.js', '!spec/viewmodel.test.js', '!spec/binds.test.js'],
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
    grunt.registerTask('default', ['build']);


};