var should = require('chai').should();
var LogWatcher = require('../index');
var os = require('os');

describe('hearthstone-log-watcher', function () {
  describe('constructor', function () {

    it('should configure default options when none are passed in.', function () {
      var logWatcher = new LogWatcher();
      logWatcher.should.have.property('options');
      logWatcher.options.should.have.property('logFile');
      logWatcher.options.should.have.property('configFile');
    });

    it('should override the options with passed in values.', function () {
      var logFile = __dirname + '/artifacts/dummy.log';
      var configFile = __dirname + '/artifacts/dummy.config';
      var logWatcher = new LogWatcher({
        logFile: logFile,
        configFile: configFile
      });
      logWatcher.should.have.property('options');
      logWatcher.options.should.have.property('logFile', logFile);
      logWatcher.options.should.have.property('configFile', configFile);
    });

  });
});
