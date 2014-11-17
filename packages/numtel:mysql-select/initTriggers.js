'use strict';
var TRIGGER_EVENTS = ['INSERT', 'UPDATE', 'DELETE'];

var Future = Npm.require('fibers/future');
var bindEnv = Meteor.bindEnvironment;

var buffer = []; // initialized trigger meta data

// @param {object} conn - node-mysql connection
// @param {string} updateTable - name of table to keep update timestamps
// @param {array} triggers - description of triggers
// @param {boolean} force - auto remove conflicting triggers
mysqlInitTriggers = function(conn, updateTable, triggers, force){
  var esc = conn.escape.bind(conn);
  var escId = conn.escapeId;
  // Grab current buffer entry for this connection/updateTable
  var bufferEntry, updatedTables = [];
  for(var i = 0; i<buffer.length; i++){
    if(buffer[i].conn === conn && buffer[i].updateTable === updateTable){
      bufferEntry = buffer[i];
      break;
    };
  };
  if(!bufferEntry){
    bufferEntry = {
      conn: conn,
      updateTable: updateTable,
      triggers: {}
    };
    buffer.push(bufferEntry);
  };

  // Add new triggers to buffer entry
  triggers.forEach(function(trigger){
    var table, updateKey, condition;
    if(typeof trigger === 'string'){
      table = trigger;
      updateKey = trigger;
      condition = true;
    }else{
      if(!trigger.table) throw new Error('table-required');
      table = trigger.table;
      updateKey = trigger.key || trigger.table;
      condition = trigger.condition || true;
    };
    if(!bufferEntry.triggers[table]) bufferEntry.triggers[table] = {};
    if(bufferEntry.triggers[table][updateKey]){
      throw new Error('duplicate-key `' + updateKey + '` on `' + table + '`');
    };
    bufferEntry.triggers[table][updateKey] = condition;
    if(updatedTables.indexOf(table) === -1 ) updatedTables.push(table);
  });

  if(force) removeTriggers(conn, updatedTables);
  // Create new triggers from buffer
  updatedTables.forEach(function(table){
    var triggerDefs = collectTableConditions(conn, table);
    var conditionString = '';
    for(var i in triggerDefs){
      if(triggerDefs.hasOwnProperty(i)){
        var def = triggerDefs[i];
        createUpdateTable(conn, def.updateTable);
        var updateKeys = getUpdateKeys(conn, def.updateTable);
        var updateId = updateKeys[i];
        if(!updateId){
          updateId  = createUpdateKey(conn, def.updateTable, i).insertId;
        };
        if(typeof def.condition === 'string'){
          conditionString += [
            'IF ' + def.condition + ' THEN ',
            '  UPDATE ' + escId(def.updateTable),
            '   SET `last_update`=now() WHERE `id` = ' + esc(updateId) + ';',
            'END IF;',
            ''
          ].join('\n');
        }else if(def.condition === true){
          conditionString += [
            'UPDATE ' + escId(def.updateTable),
            ' SET `last_update`=now() WHERE `id` = ' + esc(updateId) + ';',
            ''
          ].join('\n');
        };
      };
    };
    TRIGGER_EVENTS.forEach(function(event){
      createTrigger(conn, table, conditionString, event);
    });
  });
};

var collectTableConditions = function(conn, table){
  var out = {};
  buffer.forEach(function(entry){
    if(entry.triggers[table]){
      for(var i in entry.triggers[table]){
        if(entry.triggers[table].hasOwnProperty(i)){
          out[i] = {
            condition: entry.triggers[table][i],
            updateTable: entry.updateTable
          };
        };
      };
    };
  });
  return out;
};

var triggerName = function(tableName, event){
  return 'meteor-live-select_' + tableName + '_' + event.toLowerCase();
};

var createTrigger = function(conn, tableName, body, event){
  var rowRef = event === 'INSERT' ? 'NEW' : 'OLD';
  return queryEx(conn, function(esc, escId){
    return [
      'CREATE TRIGGER ' + escId(triggerName(tableName, event)),
      'AFTER ' + event + ' ON ' + escId(tableName),
      'FOR EACH ROW',
      'BEGIN',
      body.replace(/\$ROW/g, rowRef),
      'END',
    ].join('\n');
  });
};

var removeTriggers = function(conn, tables){
  var result = queryEx(conn, 'show triggers;');
  result.forEach(function(row){
    if(tables.indexOf(row.Table) > -1 && row.Timing === 'AFTER'){
      removeTrigger(conn, row.Trigger);
    };
  });
};

var removeTrigger = function(conn, name){
  return queryEx(conn, function(esc, escId){
    return 'drop trigger ' + escId(name) + ';';
  });
};

var getUpdateKeys = function(conn, updateTable){
  var result = queryEx(conn, function(esc, escId){
    return 'select `id`, `key` from ' + escId(updateTable) + ';';
  });
  var out = {};
  result.forEach(function(row){
    out[row.key] = row.id;
  });
  return out;
};

var createUpdateTable = function(conn, updateTable){
  return queryEx(conn, function(esc, escId){
    return [
      'CREATE TABLE IF NOT EXISTS' + escId(updateTable) + ' (',
        '`id` int(11) NOT NULL AUTO_INCREMENT,',
        '`key` varchar(100) DEFAULT NULL,',
        '`last_update` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,',
        'PRIMARY KEY (`id`),',
        'UNIQUE KEY `key_UNIQUE` (`key`)',
      ') ENGINE=MyISAM;'
    ].join('\n');
  });
};

var createUpdateKey = function(conn, updateTable, key){
  return queryEx(conn, function(esc, escId){
    return [
      'INSERT INTO ' + escId(updateTable) + ' (`key`) ',
      'VALUES (' + esc(key) + ')'
    ].join('\n');
  });
};

// Perform a query synchronously
// @param {string|function} query - optional function(escape, escapeId){...}
var queryEx = function(conn, query){
  var fut = new Future();
  var escId = conn.escapeId;
  var esc = conn.escape.bind(conn);
  if(typeof query === 'function'){
    query = query(esc, escId);
  };
  conn.query(query, bindEnv(function(error, rows, fields){
    if(error) return fut['throw'](error);
    fut['return'](rows);
  }));
  return fut.wait();
};
