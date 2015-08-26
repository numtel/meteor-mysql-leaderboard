# MySQL Leaderboard Example

The familiar Meteor Leaderboard example modified to use a MySQL backend, reactively!

This example uses the following new package for MySQL integration:

* [numtel:mysql](https://github.com/numtel/meteor-mysql)

## Quick start

### Using Embedded MySQL Server

The [`numtel:mysql-server` Meteor Package](https://github.com/numtel/meteor-mysql-server) can be used to embed a MySQL server into your Meteor application, just as Mongo is embedded by default. At this time there is not yet Windows support but Linux (32 and 64 bit) as well as Mac OSX are supported.

When using `numtel:mysql-server`, the configuration settings will be read from `leaderboard.mysql.json`.

```bash
$ git clone https://github.com/numtel/meteor-mysql-leaderboard.git
$ cd meteor-mysql-leaderboard

# Install mysql-server package
$ meteor add numtel:mysql-server

$ meteor
```

### Using Externally Configured MySQL Server

This example requires a MySQL server configured to output the binary log in row mode.

See [the `mysql-live-select` installation instructions](https://github.com/numtel/mysql-live-select#installation) for more details...

```bash
$ git clone https://github.com/numtel/meteor-mysql-leaderboard.git
$ cd meteor-mysql-leaderboard

# Create `leaderboard` database and import sample tables and data
$ mysql -uUSERNAME -pPASSWORD < leaderboard.sql

# Update database connection settings in your favorite editor (line 60)
$ ed leaderboard.js

$ meteor
```
