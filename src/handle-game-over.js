var handleGameOver = function (line, parserState, emit, log) {
  // Check if the game is over.
  var gameOverRegex = /\[Power\] GameState\.DebugPrintPower\(\) - TAG_CHANGE Entity=(.*) tag=PLAYSTATE value=(LOST|WON|TIED)$/;
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
      emit('game-over', parserState.players);
      parserState.reset();
    }
  }

  return parserState;
};

module.exports = handleGameOver;
