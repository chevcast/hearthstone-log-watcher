var LogWatcher = require('./index.js');
var lw = new LogWatcher();
lw.on('game-start', console.log.bind(console));
lw.on('game-over', console.log.bind(console));
lw.on('zone-change', console.log.bind(console));
lw.start();
