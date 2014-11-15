'use strict';

var Future = Npm.require('fibers/future');
var mysql = Npm.require('mysql');

var latestUpdate = 0;
var tableIds = {};

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
        tableIds[row.table_name] = row.id;
        tableNames.push(row.table_name);
      });
      fut['return'](tableNames);
    });
  return fut.wait();
};

// Syncronize a collection's documents with the rows from a select query
// Update automatically when specified trigger tables update
Mongo.Collection.prototype.syncMySQLSelect = function(conn, query, triggers){
  console.log(pollUpdateTable(conn));
};
