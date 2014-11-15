'use strict';
var POLL_INTERVAL = 1000;

var Future = Npm.require('fibers/future');
var mysql = Npm.require('mysql');

var latestUpdate = 0;
var linkedTables = {};
var linkedConn = [];

// Syncronize a collection's documents with the rows from a select query
// Update automatically when specified trigger tables update
// @param {object} conn - node-mysql connection
// @param {string} query - select statement
// @param {[string]} triggers - table names to refresh query on change
Mongo.Collection.prototype.syncMySQLSelect = function(conn, query, triggers){
  var self = this;
  var collectionArgs = [self, conn, query];
  // Add record
  if(linkedConn.indexOf(conn) === -1) linkedConn.push(conn);
  triggers.forEach(function(trigger){
    if(!linkedTables[trigger]) linkedTables[trigger] = new Array();
    linkedTables[trigger].push(collectionArgs);
  });
  // Perform first update
  updateCollection.apply(null, collectionArgs);
};

var pollUpdateTable = function(conn){
  var fut = new Future();
  conn.query(
    'select * from updates where `last_update` > "' + latestUpdate + '"',
    function(error, rows, fields){
      if(error) return fut['throw'](error);
      var tableNames = [];
      var latestInt = 0;
      rows && rows.forEach(function(row){
        var rowTimestamp = new Date(row.last_update).getTime();
        if(rowTimestamp > latestInt){
          latestUpdate = row.last_update;
          latestInt = rowTimestamp;
        };
        tableNames.push(row.table_name);
      });
      fut['return'](tableNames);
    });
  return fut.wait();
};

var managePoll = function(){
  linkedConn.forEach(function(conn){
    var updatedTables = pollUpdateTable(conn);
    for(var tableName in linkedTables){
      if(linkedTables.hasOwnProperty(tableName) &&
          updatedTables.indexOf(tableName) > -1){
        linkedTables[tableName].forEach(function(collectionArgs){
          updateCollection.apply(null, collectionArgs);
        });
      };
    };
  });
  Meteor.setTimeout(managePoll, POLL_INTERVAL);
};
managePoll();

var updateCollection = function(collection, conn, query){
  var fut = new Future();
  conn.query(query, Meteor.bindEnvironment(function(error, rows, fields){
    if(error) fut['throw'](error);
    collection.remove({}, function(error){
      if(error) fut['throw'](error);
      rows.forEach(function(row){
        collection.insert(row);
      });
      fut['return']();
    });
  }));
  return fut.wait();
};
