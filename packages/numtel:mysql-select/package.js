Package.describe({
  name: 'numtel:mysql-select',
  summary: 'Reactively bind MySQL Select statements to Mongo Collections',
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
    'mysqlQueryEx.js',
    'mysqlInitTriggers.js',
    'syncMysqlSelect.js'
  ], 'server');
  api.export('mysql', 'server'); // node-mysql
  api.export('mysqlQueryEx', 'server');
  api.export('mysqlInitTriggers', 'server');
});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('numtel:mysql-select');
});
