'use strict';
// numtel:mysql-select
// MIT License, ben@latenightsketches.com

var Future = Npm.require('fibers/future');
var bindEnv = Meteor.bindEnvironment;

// Perform a query synchronously
// @param {string|function} query - optional function(escape, escapeId){...}
mysqlQueryEx = function(conn, query){
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
