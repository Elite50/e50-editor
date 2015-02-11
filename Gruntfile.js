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
          'demo/styles/demo.css': 'demo/styles/demo.scss'
        }
      },
      demo: {
        files: {
          'demo/styles/demo.css': 'demo/styles/demo.scss'
        }
      }
    },
    watch: {
      build: {
        options: {
          livereload: 1339
        },
        files: ['src/**/*.js', 'demo/*.html', 'demo/*.js', 'Gruntfile.js', 'demo/**/*.scss', 'src/scss/*.scss'],
        tasks: ['default']
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