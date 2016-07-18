var newPlayerIds = function (line, players) {
  var findEntityId = function (arr, value) {
    return arr.find(function(element) {
      return element.entityId === value;
    });
  };

  var entityRegex = /\[Power\] GameState.DebugPrintPower\(\)\s-\s*Player EntityID=(.) PlayerID=(.) GameAccountId=/;
  if (entityRegex.test(line)) {
    var parts = entityRegex.exec(line);
    var id = parseInt(parts[2]);
    var entityId = parseInt(parts[1]);
    if(!findEntityId(players, entityId)) {
      players.push({
        id: id,
        entityId: entityId
      });
    }
  }

  return players;
}

module.exports = newPlayerIds;
