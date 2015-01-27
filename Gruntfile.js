module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    ngAnnotate: {
      build: {
        files: {
          'dist/<%= pkg.name %>.js': ['src/**/*.js']
        }
      }
    },
    html2js: {
      options: {
        module: 'e50Editor.tpls'
      },
      main: {
        src: ['src/views/*.html'],
        dest: 'src/tpl/e50-templates.js'
      },
    },      
    uglify: {
      options: {
        stripBanners: true,
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
      },
      build: {
        src: 'dist/<%= pkg.name %>.js',
        dest: 'dist/<%= pkg.name %>.min.js',
      }
    },
    sass: {
      dist: {
        files: {
          'dist/e50-editor.css':'src/scss/e50-editor.scss',
          'demo/demo.css': 'demo/demo.scss',
          'demo/template.css': 'demo/template.scss'
        }
      },
      demo: {
        files: {
          'demo/demo.css': 'demo/demo.scss'
        }
      }
    },
    watch: {
      build: {
        options: {
          livereload: 1337
        },
        files: ['src/**/*.*', 'demo/*.html', 'demo/*.js', 'Gruntfile.js'],
        tasks: ['default']
      },
      sass: {
        options: {
          livereload:1337
        },
        files: ['src/**/*.scss', 'demo/*.scss'],
        tasks:['sass']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-html2js');
  grunt.loadNpmTasks('grunt-ng-annotate');

  grunt.registerTask('default', [
    'html2js',
    'ngAnnotate',
    'sass',
    'uglify'
  ]);

  grunt.registerTask('dev', [
    'default',
    'watch'
  ]);
};