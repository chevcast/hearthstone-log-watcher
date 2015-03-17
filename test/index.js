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

  describe('instance', function () {

    it ('should allow the watcher to be started and stopped.', function () {
      var logWatcher = new LogWatcher();
      logWatcher.should.have.property('start').which.is.a('function');
      logWatcher.should.have.property('stop').which.is.a('function');
      logWatcher.should.not.have.ownProperty('stop');
      logWatcher.start();
      logWatcher.should.have.ownProperty('stop')
      logWatcher.stop.should.be.a('function');
      logWatcher.stop();
      logWatcher.should.have.property('stop').and.be.a('function');
      logWatcher.should.not.have.ownProperty('stop');
    });

  });
});
