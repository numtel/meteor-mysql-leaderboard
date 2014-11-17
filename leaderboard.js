// Set up a collection to contain player information. On the server,
// it is backed by a MongoDB collection named "players".

Players = new Mongo.Collection("players");

if (Meteor.isClient) {
  Template.leaderboard.helpers({
    players: function () {
      return Players.find({}, { sort: { score: -1, name: 1 } });
    },
    selectedName: function () {
      var player = Players.findOne(Session.get("selectedPlayer"));
      return player && player.name;
    }
  });

  Template.leaderboard.events({
    'click .inc': function () {
      Players.update(Session.get("selectedPlayer"), {$inc: {score: 5}});
    }
  });

  Template.player.helpers({
    selected: function () {
      return Session.equals("selectedPlayer", this._id) ? "selected" : '';
    }
  });

  Template.player.events({
    'click': function () {
      Session.set("selectedPlayer", this._id);
    }
  });
}

// On server startup, create some players if the database is empty.
if (Meteor.isServer) {
  Meteor.startup(function () {
    var mysqlSettings = {
      host: 'localhost',
      user: 'root',
      password: 'numtel',
      database: 'meteor'
    };
    var mysqlConn = mysql.createConnection(mysqlSettings);
    mysqlConn.connect();

    mysqlInitTriggers(mysqlConn, 'updates', ['players'], true);
    
    Players.syncMysqlSelect(mysqlConn, 'select * from players', ['players'], 'updates', 'id');

  });
}
