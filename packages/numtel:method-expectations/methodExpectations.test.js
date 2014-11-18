if(Meteor.isServer){
  Meteor.methods({
    'testMethod': function(val){
      return 42;
    },
    'advMethod': function(val){
      return 34;
    }
  });
}else if(Meteor.isClient){
  var counter = 0;
  var buffer;

  methodExp({
    'testMethod': function(val){
      counter += val;
    },
    'advMethod': {
      onCall: function(val){
        buffer = counter;
        counter = val;
      },
      onData: function(error, result){
        counter = buffer;
      }
    }
  });

  Tinytest.addAsync('methodExpectations - simple', function(test, done){
    var originalValue = counter;
    callExp('testMethod', 5, function(error, result){
      test.equal(originalValue + 5, counter);
      test.isFalse(error);
      test.equal(result, 42);
      done();
    });
  });

  Tinytest.addAsync('methodExpectations - advanced', function(test, done){
    var originalValue = counter;
    callExp('advMethod', 37, function(error, result){
      test.equal(originalValue, counter);
      test.isFalse(error);
      test.equal(result, 34);
      done();
    });
    test.equal(counter, 37);
  });
};

