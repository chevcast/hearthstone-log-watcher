var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
chai.should();
chai.use(sinonChai);

var LogWatcher = require('../index');
var findPlayerName = require('../lib/find-player-name');
var newPlayerIds = require('../lib/new-player-ids');
var handleZoneChanges = require('../lib/handle-zone-changes');
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

  describe('new player parsing', function () {
    it('returns player ids', function () {
      // 2016-07-14 23:14:06.191: [Power] GameState.DebugPrintPower() -     Player EntityID=3 PlayerID=2 GameAccountId=[hi=144115198130930503 lo=17958543]
      var line = "2016-07-14 23:14:06.187: [Power] GameState.DebugPrintPower() -     Player EntityID=2 PlayerID=1 GameAccountId=[hi=144115198130930503 lo=17091053]";
      var players = [];
      players = newPlayerIds(line, players);
      expect(players).to.have.lengthOf(1);
      expect(players).to.deep.equal([{id: 1, entityId: 2}])
    });

    it('matches a new player name', function () {
      var line = "2016-07-14 23:07:34.876: [Zone] ZoneChangeList.ProcessChanges() - processing index=66 change=powerTask=[power=[type=TAG_CHANGE entity=[id=2 cardId= name=artaios] tag=PLAYSTATE value=PLAYING] complete=False] entity=artaios srcZoneTag=INVALID srcPos= dstZoneTag=INVALID dstPos=";
      var players = [{id: 1, entityId: 2}];
      players = findPlayerName(line, players);
      expect(players).to.have.lengthOf(1);
      expect(players).to.deep.equal([{name: 'artaios', entityId: 2, id: 1}])
    });
  });

  describe('handle zone changes', function () {
    var sandbox, log, emit;
    beforeEach(function () {
      sandbox = sinon.sandbox.create();
      log = { zoneChange: sandbox.spy(), gameStart: sandbox.spy() };
      emit = sandbox.spy();
    });

    afterEach(function () {
      sandbox.restore();
    });

    it('handles a normal game card', function () {
      var line = '2016-07-14 23:07:36.270: [Zone] ZoneChangeList.ProcessChanges() - id=2 local=False [name=Elise Starseeker id=15 zone=HAND zonePos=0 cardId=LOE_079 player=1] zone from FRIENDLY DECK -> FRIENDLY HAND';
      var parserState = { players: [], playerCount: 0 };
      var expected = {
        cardName: 'Elise Starseeker',
        entityId: 15,
        cardId: 'LOE_079',
        playerId: 1,
        fromTeam: 'FRIENDLY',
        fromZone: 'DECK',
        toTeam: 'FRIENDLY',
        toZone: 'HAND'
      };
      parserState = handleZoneChanges(line, parserState, emit, log);

      expect(log.zoneChange).to.have.been.calledWith('%s moved from %s %s to %s %s.', expected.cardName, expected.fromTeam, expected.fromZone, expected.toTeam, expected.toZone);
      expect(emit).to.have.been.calledWith('zone-change', expected);
    });

    it('handles heros', function () {
      var line = '2016-07-14 23:07:34.867: [Zone] ZoneChangeList.ProcessChanges() - id=1 local=False [name=Garrosh Hellscream id=64 zone=PLAY zonePos=0 cardId=HERO_01 player=1] zone from  -> FRIENDLY PLAY (Hero)';
      var parserState = { players: [{name: 'artaios', entityId: 2, id: 1}], playerCount: 0 };
      var expected = {
        cardName: 'Garrosh Hellscream',
        entityId: 64,
        cardId: 'HERO_01',
        playerId: 1,
        fromTeam: undefined,
        fromZone: undefined,
        toTeam: 'FRIENDLY',
        toZone: 'PLAY (Hero)'
      };
      parserState = handleZoneChanges(line, parserState, emit, log);

      expect(log.zoneChange).to.have.been.calledWith('%s moved from %s %s to %s %s.', expected.cardName, expected.fromTeam, expected.fromZone, expected.toTeam, expected.toZone);
      expect(emit).to.have.been.calledWith('zone-change', expected);
      expect(parserState.playerCount).to.equal(1);
    });

    it('emits game start event when two heros have moved', function () {
      var line = '2016-07-14 23:07:34.867: [Zone] ZoneChangeList.ProcessChanges() - id=1 local=False [name=Garrosh Hellscream id=64 zone=PLAY zonePos=0 cardId=HERO_01 player=1] zone from  -> FRIENDLY PLAY (Hero)';
      var parserState = { players: [{name: 'artaios', entityId: 2, id: 1}, {name: 'foo', entityId: 3, id: 2}], playerCount: 0 };
      parserState = handleZoneChanges(line, parserState, emit, log);
      line = '2016-07-14 23:07:34.870: [Zone] ZoneChangeList.ProcessChanges() - id=1 local=False [name=Anduin Wrynn id=66 zone=PLAY zonePos=0 cardId=HERO_09 player=2] zone from  -> OPPOSING PLAY (Hero)';
      parserState = handleZoneChanges(line, parserState, emit, log);
      expect(parserState.playerCount).to.equal(2);
      expect(log.gameStart).to.have.been.calledWith('A game has started.')
      expect(emit).to.have.been.calledWith('game-start', parserState.players);
    });
  });
});
