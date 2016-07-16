var LogWatcher = require('./lib/index.js');
var lw = new LogWatcher();
lw.on('game-start', console.log.bind(console, 'game-start'));
lw.on('game-over', console.log.bind(console, 'game-over:'));
lw.on('zone-change', console.log.bind(console, 'zone-change:'));
lw.start();
