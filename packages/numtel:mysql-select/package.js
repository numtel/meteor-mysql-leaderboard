Package.describe({
  name: 'numtel:mysql-select',
  summary: ' /* Fill me in! */ ',
  version: '1.0.0',
  git: ' /* Fill me in! */ '
});

Npm.depends({
  mysql: '2.5.3'
});

Package.onUse(function(api) {
  api.versionsFrom('1.0');
  api.use([
    'mongo'
  ]);
  api.addFiles([
    'syncMySQLSelect.js'
  ], 'server');
});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('numtel:mysql-select');
});
