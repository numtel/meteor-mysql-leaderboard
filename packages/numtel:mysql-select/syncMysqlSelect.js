'use strict';
// numtel:mysql-select
// MIT License, ben@latenightsketches.com

var POLL_INTERVAL = 1000;
var linkedColl = []; // buffer for collection meta data

mysql = Npm.require('mysql');
var Future = Npm.require('fibers/future');

// Synchronize a collection's documents with the rows from a select query
// Update automatically when specified trigger tables update
// @param {object} conn - node-mysql connection
// @param {string} updateTable - name of table that keeps update timestamps
// @param {[string]} triggers - update key names to refresh query on change
// @param {string} query - select statement
// @param {string} idField - field name to use as mongo doc _id
Mongo.Collection.prototype.syncMysqlSelect =
    function(conn, updateTable, triggers, query, idField){
  var self = this;
  // Arguments for updateCollection()
  var collectionArgs = [self, conn, query, idField];
  // Build runtime meta data
  var collMeta = {
    conn: conn,
    triggerKeys: {},
    updateTable: updateTable,
    latestUpdate: 0
  };
  triggers.forEach(function(trigger){
    if(!collMeta.triggerKeys[trigger]) collMeta.triggerKeys[trigger] = new Array();
    collMeta.triggerKeys[trigger].push(collectionArgs);
  });
  linkedColl.push(collMeta);
  // Perform first update
  updateCollection.apply(null, collectionArgs);
};

var pollUpdateTable = function(collMeta){
  var updates = mysqlQueryEx(collMeta.conn, function(esc, escId){
    return 'select `key`, `last_update` from ' + escId(collMeta.updateTable) +
            ' where `last_update` > ' + esc(collMeta.latestUpdate)
  });
  var updateKeys = [];
  var latestInt = 0;
  updates && updates.forEach(function(row){
    var rowTimestamp = new Date(row.last_update).getTime();
    if(rowTimestamp > latestInt){
      collMeta.latestUpdate = row.last_update;
      latestInt = rowTimestamp;
    };
    updateKeys.push(row.key);
  });
  return updateKeys;
};

var managePoll = function(){
  linkedColl.forEach(function(collMeta){
    var updatedKeys = pollUpdateTable(collMeta);
    for(var triggerKey in collMeta.triggerKeys){
      if(collMeta.triggerKeys.hasOwnProperty(triggerKey) &&
          updatedKeys.indexOf(triggerKey) > -1){
        collMeta.triggerKeys[triggerKey].forEach(function(collectionArgs){
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
  var rows = mysqlQueryEx(conn, query);
  var updateRows = [], resultIds = [], newIds = [];
  rows.forEach(function(row){
    if(idField && row[idField]){
      if(typeof row[idField] === 'number'){
        // Mongo does not allow numbers for _id
        row._id = 'x-' + row[idField].toString();
      }else{
        row._id = row[idField];
      };
      resultIds.push(row._id);
      var existing = collection.findOne(row._id);
      if(!existing) newIds.push(row._id);
      if(!existing || (JSON.stringify(existing) !== JSON.stringify(row))){
        updateRows.push(row);
      };
    };
  });
  collection.remove({ _id: { $nin: resultIds } }, function(error){
    if(error) fut['throw'](error);
    updateRows.forEach(function(row){
      if(newIds.indexOf(row._id) === -1){
        collection.update(row._id, row);
      }else{
        collection.insert(row);
      };
    });
    fut['return']();
  });
  return fut.wait();
};
