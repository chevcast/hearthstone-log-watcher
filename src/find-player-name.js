var findPlayerName = function (line, players) {
  // Check for players entering play and track their team IDs.
  //
  // 2016-07-14 23:07:34.876: [Zone] ZoneChangeList.ProcessChanges() - processing index=66 change=powerTask=[power=[type=TAG_CHANGE entity=[id=2 cardId= name=artaios] tag=PLAYSTATE value=PLAYING] complete=False] entity=artaios srcZoneTag=INVALID srcPos= dstZoneTag=INVALID dstPos=
  // 2016-07-14 23:07:34.877: [Zone] ZoneChangeList.ProcessChanges() - processing index=67 change=powerTask=[power=[type=TAG_CHANGE entity=[id=3 cardId= name=Phaust] tag=PLAYSTATE value=PLAYING] complete=False] entity=Phaust srcZoneTag=INVALID srcPos= dstZoneTag=INVALID dstPos=


  var newPlayerRegex = /TAG_CHANGE entity=\[id=(.) cardId= name=(.*)\] tag=PLAYSTATE value=PLAYING/;
  if (newPlayerRegex.test(line)) {
    var parts = newPlayerRegex.exec(line);
    players.forEach(function (player) {
      if(player.entityId == parseInt(parts[1])) {
        player.name = parts[2];
      }
    });
  }

  return players;
};

module.exports = findPlayerName;
