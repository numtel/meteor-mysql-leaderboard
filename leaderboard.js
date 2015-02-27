// Data is read from select statements published by server
players = new MysqlSubscription('allPlayers');
myScore = new MysqlSubscription('playerScore', 'Maxwell');

myScore.addEventListener('update', function(index, msg){
  console.log(msg.fields.score);
});

if (Meteor.isClient) {

  // Provide a client side stub
  Meteor.methods({
    'incScore': function(id, amount){
      var originalIndex;
      players.forEach(function(player, index){
        if(player.id === id){
          originalIndex = index;
          players[index].score += amount;
          players.changed();
        }
      });

      // Reverse changes if needed (due to resorting) on update
      players.addEventListener('update.incScoreStub', function(index, msg){
        if(originalIndex !== index){
          players[originalIndex].score -= amount;
        }
        players.removeEventListener('update.incScoreStub');
      });
    }
  });

  Template.leaderboard.helpers({
    players: function () {
      return players.reactive();
    },
    selectedName: function () {
      players.depend();
      var player = players.filter(function(player){
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
    user: 'root',
    password: 'numtel',
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

  Meteor.publish('allPlayers', function(){
    return liveDb.select(
      'SELECT * FROM players ORDER BY score DESC',
      [ { table: 'players' } ]
    );
  });

  Meteor.publish('playerScore', function(name){
    return liveDb.select(
      'SELECT id, score FROM players WHERE name = ' + liveDb.db.escape(name),
      [
        {
          table: 'players',
          condition: function(row, newRow){
            return row.name === name;
          }
        }
      ]
    );
  });

  Meteor.methods({
    'incScore': function(id, amount){
      if(typeof id === 'number' && typeof amount === 'number'){
        liveDb.db.query(
          'UPDATE players SET score = score + ? WHERE id = ?',
          [ amount, id ]
        );
      }
    }
  });
}
