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
    var db = mysql.createConnection(mysqlSettings);
    db.connect();

    mysqlInitTriggers(
      db, // connection from node-mysql (included in package)
      'updates3', // update trigger table name
      [ // describe triggers to initialize
        'players', // the simplest trigger is a string, queries will be
                   // refreshed when any row on the table changes
        { // complex triggers
          table: 'players', // table name to hook (required)
          key: 'myfeed', // specify a key to trigger live-selects (optional)
                         // default: table name
          condition: '$ROW.name = "dude"' // Conditional terms (optional)
                                          // Not escaped by library, be careful
                                          // Access new row on insert,
                                          // old row on update/delete using
                                          // $ROW symbol
        }
      ],
      true // force out any triggers currently in place
           // if false, an error will be thrown if competing trigger exists
    );
    
    Players.syncMysqlSelect(
      db, // connection from node-mysql (included in package)
      'select * from players', // any select query
      ['players'], // update triggers to refresh query
      'updates3', // update trigger table name
      'id' // field for collection _id
    );

  });
}
