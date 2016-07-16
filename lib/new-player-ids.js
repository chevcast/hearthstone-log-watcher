var newPlayerIds = function (line, players) {
  //
  var entityRegex = /\[Power\] GameState.DebugPrintPower\(\)\s-\s*Player EntityID=(.) PlayerID=(.) GameAccountId=/;
  if (entityRegex.test(line)) {
    var parts = entityRegex.exec(line);
    players.push({
      id: parseInt(parts[2]),
      entityId: parseInt(parts[1])
    });
  }

  return players;
}

module.exports = newPlayerIds;
