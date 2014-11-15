'use strict';

var Future = Npm.require('fibers/future');
var mysql = Npm.require('mysql');

var latestUpdate = 0;
var tableIds = {};

pollUpdateTable = function(connection){
  var fut = new Future();
  var latestInt = 0;
  connection.query(
    'select * from updates where `last_update` > "' + latestUpdate + '"',
    function(error, rows, fields){
      if(error) return fut['throw'](error);
      var tableNames = [];
      rows && rows.forEach(function(row){
        var rowTimestamp = new Date(row.last_update).getTime() / 1000;
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
liveSelect = function(collection, connection, query, triggers){
};
