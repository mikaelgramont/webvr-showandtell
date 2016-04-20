module.exports = function(karma) {
  karma.set({
    // Run tests in all of these browsers everytime:
    browsers: [
      'PhantomJS',
      // 'Chrome'
    ],

    frameworks: [
      'browserify',
      'jasmine'
    ],
    
    // Only list spec files as we're only concerned with tests,
    // not regular bundles for production.
    files: [
      'js/specs/*-spec.js'
    ],
    
    preprocessors: {
      // All JS files need to be processed. Browserify will figure
      // out dependencies on its own.
      'js/**/*.js': [ 'browserify' ]
    },

    // Run the tests when tests or source files change.
    autoWatch: true,

    browserify: {
      debug: true,
      transform: [
        [
          'babelify', {
            presets: [
              // This triggers ES6 transpiling.
              "es2015",
              // This activates some necessary settings for the transpiling.
              "stage-0"
            ]
          }
        ]
      ]
    },

    phantomjsLauncher: {
      // Have phantomjs exit if a ResourceError is encountered (useful if karma exits without killing phantom)
      exitOnResourceError: true
    }    
  });
}
