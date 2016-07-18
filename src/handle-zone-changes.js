var handleZoneChanges = function (line, parserState, emit, log) {
  // Check if a card is changing zones.
  var zoneChangeRegex = /\[Zone\] ZoneChangeList.ProcessChanges\(\) - id=\d* local=.* \[name=(.*) id=(\d*) zone=.* zonePos=\d* cardId=(.*) player=(\d)\] zone from ?(FRIENDLY|OPPOSING)? ?(.*)? -> ?(FRIENDLY|OPPOSING)? ?(.*)?$/
  if (zoneChangeRegex.test(line)) {
    var parts = zoneChangeRegex.exec(line);
    var data = {
      cardName: parts[1],
      entityId: parseInt(parts[2]),
      cardId: parts[3],
      playerId: parseInt(parts[4]),
      fromTeam: parts[5],
      fromZone: parts[6],
      toTeam: parts[7],
      toZone: parts[8]
    };

    log.zoneChange('%s moved from %s %s to %s %s.', data.cardName, data.fromTeam, data.fromZone, data.toTeam, data.toZone);
    emit('zone-change', data);
    // Only zone transitions show both the player ID and the friendly or opposing zone type. By tracking entities going into
    // the "PLAY (Hero)" zone we can then set the player's team to FRIENDLY or OPPOSING. Once both players are associated with
    // a team we can emite the game-start event.
    if (parserState.playerCount < 2 && data.toZone === 'PLAY (Hero)') {
      parserState.players.forEach(function (player) {
        if (player.id === data.playerId) {
          player.team = data.toTeam;
          parserState.playerCount++;
          if (parserState.playerCount === 2) {
            log.gameStart('A game has started.');
            emit('game-start', parserState.players);
          }
        }
      });
    }
  }

  return parserState;
}

module.exports = handleZoneChanges
