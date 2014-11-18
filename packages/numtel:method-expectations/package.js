Package.describe({
  name: 'numtel:method-expectations',
  summary: ' /* Fill me in! */ ',
  version: '1.0.0',
  git: ' /* Fill me in! */ '
});

Package.onUse(function(api) {
  api.versionsFrom('1.0');
  api.addFiles('methodExpectations.js', 'client');
  api.export('methodExp', 'client');
  api.export('callExp', 'client');
});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('numtel:method-expectations');
  api.addFiles('methodExpectations.test.js');
});
