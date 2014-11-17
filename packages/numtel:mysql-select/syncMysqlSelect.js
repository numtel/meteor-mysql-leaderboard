'use strict';
var POLL_INTERVAL = 1000;

mysql = Npm.require('mysql');
var Future = Npm.require('fibers/future');
var bindEnv = Meteor.bindEnvironment;

var linkedColl = []; // buffer for collection meta data

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
  var fut = new Future();
  var escId = collMeta.conn.escapeId;
  var esc = collMeta.conn.escape.bind(collMeta.conn);
  collMeta.conn.query(
    'select `key`, `last_update` from ' + escId(collMeta.updateTable) +
    ' where `last_update` > ' + esc(collMeta.latestUpdate),
    bindEnv(function(error, rows, fields){
      if(error) return fut['throw'](error);
      var updateKeys = [];
      var latestInt = 0;
      rows && rows.forEach(function(row){
        var rowTimestamp = new Date(row.last_update).getTime();
        if(rowTimestamp > latestInt){
          collMeta.latestUpdate = row.last_update;
          latestInt = rowTimestamp;
        };
        updateKeys.push(row.key);
      });
      fut['return'](updateKeys);
    }));
  return fut.wait();
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
  conn.query(query, Meteor.bindEnvironment(function(error, rows, fields){
    if(error) return fut['throw'](error);
    var updateRows = [], removeIds = [], foundIds = [];
    rows.forEach(function(row){
      if(idField && row[idField]){
        if(typeof row[idField] === 'number'){
          // Mongo does not allow numbers for _id
          row._id = 'x-' + row[idField].toString();
        }else{
          row._id = row[idField];
        };
        var existing = collection.findOne(row._id);
        foundIds.push(row._id);
        if(!existing || (JSON.stringify(existing) !== JSON.stringify(row))){
          updateRows.push(row);
          removeIds.push(row._id);
        };
      };
    });
    foundIds = foundIds.filter(function(id){
      return removeIds.indexOf(id) === -1;
    });
    collection.remove({ _id: { $nin: foundIds } }, function(error){
      if(error) fut['throw'](error);
      updateRows.forEach(function(row){
        collection.insert(row);
      });
      fut['return']();
    });
  }));
  return fut.wait();
};
