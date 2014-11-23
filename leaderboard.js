// Data is read from select statements published by server
players = new MysqlSubscribe('allPlayers');
myScore = new MysqlSubscribe('playerScore', 'Maxwell');

// myScore.on('update', function(index, msg){
//   console.log(msg.fields.score);
// });

if (Meteor.isClient) {

  // Provide an instantaneous client side expectation of Meteor method
  methodExp({
    'incScore': function(id, amount){
      var originalIndex;
      players.forEach(function(player, index){
        if(player.id === id){
          originalIndex = index;
          players[index].score += amount;
          players.dep.changed();
        }
      });

      // Reverse changes if needed (due to resorting) on update
      var updateHandler = function(index, msg){
        if(originalIndex !== index){
          players[originalIndex].score -= amount;
        }
        players.removeHandler('update', updateHandler);
      };
      players.on('update', updateHandler);
    }
  });

  Template.leaderboard.helpers({
    players: function () {
      players.dep.depend();
      return players;
    },
    selectedName: function () {
      players.dep.depend();
      var player = players.filter(function(player){
        return player.id === Session.get("selectedPlayer");
      });
      return player.length && player[0].name;
    }
  });

  Template.leaderboard.events({
    'click .inc': function () {
      // Call expectation enhanced method
      callExp('incScore', Session.get("selectedPlayer"), 5);
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
  var db;
  var mysqlSettings = {
    host: 'localhost',
    user: 'root',
    password: 'numtel',
    database: 'leaderboard'
  };

  Meteor.startup(function () {
    db = mysql.createConnection(mysqlSettings);
    db.connect();
    db.initUpdateTable('updates8');

    Meteor.publish('allPlayers', function(){
      db.select(this, {
        query: 'select * from players order by score desc',
        triggers: [
          { table: 'players' }
        ]
      });
    });

    Meteor.publish('playerScore', function(name){
      db.select(this, {
        query: function(esc, escId){
          return 'select `score` from `players` where `name`=' + esc(name);
        },
        triggers: [
          {
            table: 'players',
            condition: function(esc, escId){
              return '$ROW.name = ' + esc(name);
            }
          }
        ]
      });
    });
  });

  Meteor.methods({
    'incScore': function(id, amount){
      // Synchronous query method with support for escaping values by passing
      // function instead of string query
      return db.queryEx(function(esc, escId){
        return 'update players set `score`=`score` + ' + esc(amount) +
                  ' where `id`=' + esc(id);
      });
    }
  });
}
