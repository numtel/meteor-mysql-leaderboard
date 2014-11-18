'use strict';

// numtel:method-expectations
// MIT License, ben@latenightsketches.com

var methodBuffer = {};

methodExp = function(methods){
  for(var i in methods){
    if(methods.hasOwnProperty(i)){
      if(methodBuffer.hasOwnProperty(i)){
        throw new Error('duplicate-method-expectation ' + i);
      };
      methodBuffer[i] = methods[i];
    };
  };
};

callExp = function(name /* arguments, ... , callback */){
  var def = methodBuffer[name];
  if(!def) throw new Error('invalid-method-expecation ' + name);
  var onCall = typeof def === 'function' ? def : def.onCall;
  var onData = typeof def === 'function' ? undefined : def.onData;
  Array.prototype.shift.call(arguments);
  var callback = Array.prototype.pop.call(arguments);
  if(typeof callback !== 'function'){
    Array.prototype.push.call(arguments, callback);
    callback = undefined;
  };
  onCall && onCall.apply(null, arguments);
  var callbackWrapper = function(error, result){
    onData && onData.apply(this, arguments);
    callback && callback.apply(this, arguments);
  };
  return Meteor.apply(name, arguments, callbackWrapper);
};
