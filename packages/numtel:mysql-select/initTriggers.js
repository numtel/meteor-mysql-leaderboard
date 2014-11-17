'use strict';
var Future = Npm.require('fibers/future');
var bindEnv = Meteor.bindEnvironment;

// @param {object} conn - node-mysql connection
// @param {string} updateTable - name of table to keep update timestamps
// @param {[string]} tables - table names
// @param {boolean} force - auto remove conflicting triggers
mysqlInitTriggers = function(conn, updateTable, tables, force){
  if(force) removeTriggers(conn, tables);
  var tableIds = getTableIds(conn, updateTable);
  tables.forEach(function(tableName){
    var tableId = tableIds[tableName];
    tableId && TRIGGER_EVENTS.forEach(function(event){
      createTrigger(conn, tableName, tableId, event, updateTable);
    });
  });
};

var TRIGGER_EVENTS = ['INSERT', 'UPDATE', 'DELETE'];

var triggerName = function(tableName, event){
  return 'meteor-live-select_' + tableName + '_' + event.toLowerCase();
};

var createTrigger = function(conn, tableName, tableId, event, updateTable){
  var fut = new Future();
  var escId = conn.escapeId;
  var esc = conn.escape.bind(conn);
  var name = triggerName(tableName, event);
  var query = [
    'CREATE TRIGGER ' + escId(name),
    'AFTER ' + event + ' ON ' + escId(tableName),
    'FOR EACH ROW',
    'BEGIN',
    'UPDATE ' + escId(updateTable),
    ' SET `last_update`=now() WHERE `id` = ' + esc(tableId) + ';',
    'END',
  ].join('\n');
  conn.query(query, bindEnv(function(error, rows, fields){
    if(error) return fut['throw'](error);
    fut['return']();
  }));
  return fut.wait();
};

var removeTriggers = function(conn, tables){
  var fut = new Future();
  var triggerNames = [];
  tables.forEach(function(tableName){
    TRIGGER_EVENTS.forEach(function(event){
      triggerNames.push(triggerName(tableName, event));
    });
  });
  conn.query('show triggers;', bindEnv(function(error, rows, fields){
    if(error) return fut['throw'](error);
    rows.forEach(function(row){
      if(triggerNames.indexOf(row.Trigger) > -1 ||
          (tables.indexOf(row.Table) > -1 && row.Timing === 'AFTER')){
        removeTrigger(conn, row.Trigger);
      };
    });
    fut['return']();
  }));
  return fut.wait();
};

var removeTrigger = function(conn, name){
  var fut = new Future();
  var escId = conn.escapeId;
  conn.query('drop trigger ' + escId(name) + ';',
    bindEnv(function(error, rows, fields){
      if(error) return fut['throw'](error);
      fut['return']();
    }));
  return fut.wait();
};

var getTableIds = function(conn, updateTable){
  var fut = new Future();
  var escId = conn.escapeId;
  conn.query('select * from ' + escId(updateTable) + ';',
    bindEnv(function(error, rows, fields){
      if(error) return fut['throw'](error);
      var out = {};
      rows.forEach(function(row){
        out[row.table_name] = row.id;
      });
      fut['return'](out);
    }));
  return fut.wait();
};
