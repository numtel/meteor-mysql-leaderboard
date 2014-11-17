'use strict';
var POLL_INTERVAL = 1000;

var Future = Npm.require('fibers/future');
var mysql = Npm.require('mysql');
var bindEnv = Meteor.bindEnvironment;

var latestUpdate = 0;
var linkedConn = [];

// Synchronize a collection's documents with the rows from a select query
// Update automatically when specified trigger tables update
// @param {object} conn - node-mysql connection
// @param {string} query - select statement
// @param {[string]} triggers - update key names to refresh query on change
// @param {string} updateTable - name of table that keeps update timestamps
// @param {string} idField - optional, field name to use as mongo doc _id
Mongo.Collection.prototype.syncMysqlSelect =
    function(conn, query, triggers, updateTable, idField){
  var self = this;
  var collectionArgs = [self, conn, query, idField];
  // Add record
  var connIndex = linkedConn.indexOf(conn);
  var connMeta;
  if(connIndex === -1) {
    connMeta = {
      conn: conn,
      tables: {},
      updateTable: updateTable
    };
    linkedConn.push(connMeta);
  }else{
    connMeta = linkedConn[connIndex];
  };
  triggers.forEach(function(trigger){
    if(!connMeta.tables[trigger]) connMeta.tables[trigger] = new Array();
    connMeta.tables[trigger].push(collectionArgs);
  });
  // Perform first update
  updateCollection.apply(null, collectionArgs);
};

var pollUpdateTable = function(connMeta){
  var fut = new Future();
  var escId = connMeta.conn.escapeId;
  var esc = connMeta.conn.escape.bind(connMeta.conn);
  connMeta.conn.query(
    'select * from ' + escId(connMeta.updateTable) +
    ' where `last_update` > ' + esc(latestUpdate),
    bindEnv(function(error, rows, fields){
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
    }));
  return fut.wait();
};

var managePoll = function(){
  linkedConn.forEach(function(connMeta){
    var updatedTables = pollUpdateTable(connMeta);
    for(var tableName in connMeta.tables){
      if(connMeta.tables.hasOwnProperty(tableName) &&
          updatedTables.indexOf(tableName) > -1){
        connMeta.tables[tableName].forEach(function(collectionArgs){
          updateCollection.apply(null, collectionArgs);
        });
      };
    };
  });
  Meteor.setTimeout(managePoll, POLL_INTERVAL);
};
managePoll();

var updateCollection = function(collection, conn, query, idField){
  var fut = new Future();
  conn.query(query, Meteor.bindEnvironment(function(error, rows, fields){
    if(error) return fut['throw'](error);
    var updateRows = [], removeIds = [];
    rows.forEach(function(row){
      if(idField && row[idField]){
        if(typeof row[idField] === 'number'){
          row._id = 'x-' + row[idField].toString();
        }else{
          row._id = row[idField];
        };
        var existing = collection.findOne(row._id);
        if(existing && JSON.stringify(existing) !== JSON.stringify(row)){
          updateRows.push(row);
          removeIds.push(row._id);
        };
      };
    });
    collection.remove({ _id: { $in: removeIds } }, function(error){
      if(error) fut['throw'](error);
      updateRows.forEach(function(row){
        collection.insert(row);
      });
      fut['return']();
    });
  }));
  return fut.wait();
};
