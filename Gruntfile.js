module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    ngAnnotate: {
      build: {
        files: {
          'dist/<%= pkg.name %>.js': ['src/tpl/**/*.js','src/**/*.js']
        }
      }
    },
    html2js: {
      options: {
        module: 'e50Editor.tpls'
      },
      main: {
        src: ['src/views/components/*.html'],
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
    watch: {
      build: {
        options: {
          livereload: 1337
        },
        files: ['src/directives/*.js','src/services/*.js', 'demo/*.html', 'demo/*.js', 'Gruntfile.js', 'src/tpl/*.html'],
        tasks: ['default']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-html2js');
  grunt.loadNpmTasks('grunt-ng-annotate');

  grunt.registerTask('default', [
    'html2js',
    'ngAnnotate',
    'uglify'
  ]);

  grunt.registerTask('dev', [
    'default',
    'watch'
  ]);
};