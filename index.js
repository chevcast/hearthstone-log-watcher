var EventEmitter = require('events').EventEmitter;
var util = require('util');
var fs = require('fs');
var path = require('path');
var os = require('os');
var extend = require('extend');

var defaultOptions = {
  endOfLineChar: os.EOL
};

var debug = require('debug');
// Define some debug logging functions for easy and readable debug messages.
var log = {
  main: debug('HLW'),
  gameStart: debug('HLW:game-start'),
  zoneChange: debug('HLW:zone-change'),
  gameOver: debug('HLW:game-over')
};

// Determine the default location of the config and log files.
if (/^win/.test(os.platform())) {
  log.main('Windows platform detected.');
  var programFiles = 'Program Files';
  if (/64/.test(os.arch())) {
    programFiles += '(x86)';
  }
  defaultOptions.logFile = path.join('C:', programFiles, 'Hearthstone', 'Hearthstone_Data', 'output_log.txt');
  defaultOptions.configFile = path.join(process.env.LOCALAPPDATA, 'Blizzard', 'Hearthstone', 'log.config');
} else {
  log.main('OS X platform detected.');
  defaultOptions.logFile = path.join(process.env.HOME, 'Library', 'Logs', 'Unity', 'Player.log');
  defaultOptions.configFile = path.join(process.env.HOME, 'Library', 'Preferences', 'Blizzard', 'Hearthstone', 'log.config');
}

// The watcher is an event emitter so we can emit events based on what we parse in the log.
function LogWatcher(options) {
    this.options = extend({}, defaultOptions, options);

    log.main('config file path: %s', this.options.configFile);
    log.main('log file path: %s', this.options.logFile);

    // Copy local config file to the correct location.
    // We're just gonna do this every time.
    var localConfigFile = path.join(__dirname, 'log.config');
    fs.createReadStream(localConfigFile).pipe(fs.createWriteStream(this.options.configFile));
    log.main('Copied log.config file to force Hearthstone to write to its log file.');
}
util.inherits(LogWatcher, EventEmitter);

LogWatcher.prototype.start = function () {
  var self = this;

  var parserState = new ParserState;

  log.main('Log watcher started.');
  // Begin watching the Hearthstone log file.
  var fileSize = fs.statSync(self.options.logFile).size;
  fs.watchFile(self.options.logFile, function (current, previous) {
    if (current.mtime <= previous.mtime) { return; }

    // We're only going to read the portion of the file that we have not read so far.
    var newFileSize = fs.statSync(self.options.logFile).size;
    var sizeDiff = newFileSize - fileSize;
    if (sizeDiff < 0) {
      fileSize = 0;
      sizeDiff = newFileSize;
    }
    var buffer = new Buffer(sizeDiff);
    var fileDescriptor = fs.openSync(self.options.logFile, 'r');
    fs.readSync(fileDescriptor, buffer, 0, sizeDiff, fileSize);
    fs.closeSync(fileDescriptor);
    fileSize = newFileSize;

    self.parseBuffer(buffer, parserState);
  });

  self.stop = function () {
    fs.unwatchFile(self.options.logFile);
    delete self.stop;
  };
};

LogWatcher.prototype.stop = function () {};

LogWatcher.prototype.parseBuffer = function (buffer, parserState) {
  var self = this;

  if (!parserState) {
    parserState = new ParserState;
  }

  // Iterate over each line in the buffer.
  buffer.toString().split(this.options.endOfLineChar).forEach(function (line) {

    // Check if a card is changing zones.
    var zoneChangeRegex = /name=(.*) id=(\d+).*cardId=(.*) .* to (FRIENDLY|OPPOSING) (.*)$/;
    if (zoneChangeRegex.test(line)) {
      var parts = zoneChangeRegex.exec(line);
      var data = {
        cardName: parts[1],
        entityId: parseInt(parts[2]),
        cardId: parts[3],
        team: parts[4],
        zone: parts[5]
      };
      log.zoneChange('%s moved to %s %s.', data.cardName, data.team, data.zone)
      self.emit('zone-change', data);
    }

    // Check for players entering play and track their team IDs.
    var newPlayerRegex = /Entity=(.*) tag=TEAM_ID value=(.)$/;
    if (newPlayerRegex.test(line)) {
      var parts = newPlayerRegex.exec(line);
      parserState.players.push({
        name: parts[1],
        teamId: parseInt(parts[2])
      });
    }

    // Look for mulligan status line that only shows for the local FRIENDLY player.
    // Compare the ID to the team ID and set player zones appropriately.
    var mulliganCountRegex = /id=(\d) ChoiceType=MULLIGAN Cancelable=False CountMin=0 CountMax=\d$/;
    if (mulliganCountRegex.test(line)) {
      var parts = mulliganCountRegex.exec(line);
      var teamId = parseInt(parts[1]);
      parserState.players.forEach(function (player) {
        if (teamId === player.teamId) {
          player.team = 'FRIENDLY';
        } else {
          player.team = 'OPPOSING';
        }
      });
      log.gameStart('A game has started.')
      self.emit('game-start', parserState.players);
    }

    // Check if the game is over.
    var gameOverRegex = /Entity=(.*) tag=PLAYSTATE value=(LOST|WON|TIED)$/;
    if (gameOverRegex.test(line)) {
      var parts = gameOverRegex.exec(line);
      // Set the status for the appropriate player.
      parserState.players.forEach(function (player) {
        if (player.name === parts[1]) {
          player.status = parts[2];
        }
      });
      parserState.gameOverCount++;
      // When both players have lost, emit a game-over event.
      if (parserState.gameOverCount === 2) {
        log.gameOver('The current game has ended.');
        self.emit('game-over', parserState.players);
        parserState.reset();
      }
    }

  });
};

function ParserState() {
  this.reset();
}

ParserState.prototype.reset = function () {
  this.players = [];
  this.gameOverCount = 0;
};


// Set the entire module to our emitter.
module.exports = LogWatcher;
