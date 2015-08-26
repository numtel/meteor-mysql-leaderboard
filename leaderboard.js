// Data is read from select statements published by server
players = new MysqlSubscription('allPlayers');
myScore = new MysqlSubscription('playerScore', 'Maxwell');

myScore.addEventListener('update', function(diff, data) {
  console.log(data[0].score);
});

if (Meteor.isClient) {

  // Provide a client side stub
  Meteor.methods({
    'incScore': function(id, amount){
      // Find the selected player in the array of results
      var selectedPlayer = players.filter(function(player) {
        return player.id === id
      })[0];

      // Increase the score
      selectedPlayer.score += amount;

      // Force UI refresh
      players.changed();
    }
  });

  Template.leaderboard.helpers({
    players: function () {
      return players.reactive();
    },
    selectedName: function () {
      players.depend();
      var player = players.filter(function(player) {
        return player.id === Session.get("selectedPlayer");
      });
      return player.length && player[0].name;
    }
  });

  Template.leaderboard.events({
    'click .inc': function () {
      Meteor.call('incScore', Session.get("selectedPlayer"), 5);
    }
  });

  Template.player.helpers({
    selected: function () {
      return Session.equals("selectedPlayer", this.id) ? "selected" : '';
    }
  });

  Template.player.events({
    'click': function () {
      Session.set("selectedPlayer", this.id);
    }
  });
}

if (Meteor.isServer) {
  var liveDb = new LiveMysql({
    host: 'localhost',
    // Port 3407 as specified in leaderboard.mysql.json
    // If using external MySQL server, the default port is 3306
    port: 3407,
    user: 'root',
    password: '',
    database: 'leaderboard'
  });

  var closeAndExit = function() {
    liveDb.end();
    process.exit();
  };
  // Close connections on hot code push
  process.on('SIGTERM', closeAndExit);
  // Close connections on exit (ctrl + c)
  process.on('SIGINT', closeAndExit);

  Meteor.publish('allPlayers', function() {
    return liveDb.select(
      'SELECT * FROM players ORDER BY score DESC',
      [ { table: 'players' } ]
    );
  });

  Meteor.publish('playerScore', function(name) {
    return liveDb.select(
      'SELECT id, score FROM players WHERE name = ' + liveDb.db.escape(name),
      [
        {
          table: 'players',
          condition: function(row, newRow, rowDeleted) {
            // newRow provided on UPDATE query events
            return row.name === name || (newRow && newRow.name === name);
          }
        }
      ]
    );
  });

  Meteor.methods({
    'incScore': function(id, amount) {
      check(id, Number);
      check(amount, Number);

      liveDb.db.query(
        'UPDATE players SET score = score + ? WHERE id = ?', [ amount, id ]);
    }
  });
}
