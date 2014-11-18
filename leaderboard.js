// Set up a collection to contain player information. On the server,
// it is backed by a MongoDB collection named "players"
// and synced with MySQL query: "select * from players;"

Players = new Mongo.Collection("players");

if (Meteor.isClient) {
  Template.leaderboard.helpers({
    players: function () {
      return Players.find({}, { sort: { score: -1, name: 1 } });
    },
    selectedName: function () {
      var player = Players.findOne({id: Session.get("selectedPlayer")});
      return player && player.name;
    }
  });

  Template.leaderboard.events({
    'click .inc': function () {
      Meteor.call('incScore', Session.get("selectedPlayer"));
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
    database: 'meteor'
  };

  Meteor.startup(function () {
    db = mysql.createConnection(mysqlSettings);
    db.connect();

    // Create table to hold updates and create triggers on specified tables
    mysqlInitTriggers(
      // connection from node-mysql (included in package)
      db,
      // update trigger table name
      'updates3',
      // describe triggers to initialize
      [ 
        // the simplest trigger is a string, queries will be
        // refreshed when any row on the table changes
        'players',
        // complex trigger example:
        {
          // table name to hook (required)
          table: 'players', 
          // specify a key to trigger live-selects (optional)
          // default: table name
          key: 'myfeed',
          // Conditional terms (optional)
          // Not escaped, be careful. (or escape yourself!)
          // Access new row on insert,
          // old row on update/delete using
          // $ROW symbol
          condition: '$ROW.name = "dude" or $ROW.score > 200'
        }
      ],
      // force out any triggers currently in place
      // if false, an error will be thrown if competing trigger exists
      true
    );
    
    // Link the collection
    Players.syncMysqlSelect(
      db, // connection from node-mysql (included)
      'updates3', // update trigger table name
      ['players'], // update triggers to refresh query
      'select * from players', // any select query
      'id' // field for collection _id
    );

  });

  Meteor.methods({
    'incScore': function(id){
      // Synchronous query method with support for escaping values
      return mysqlQueryEx(db, function(esc, escId){
        return 'update players set `score`=`score` + 5 where `id`=' + esc(id);
      });
    }
  });
}
