# MySQL Leaderboard Example

The familiar Meteor Leaderboard example modified to use a MySQL backend, reactively!

This example uses the following new package for MySQL integration:

* [numtel:mysql](https://github.com/numtel/meteor-mysql)

## Quick start

This example requires a MySQL server configured to output the binary log in row mode.

See [the `mysql-live-select` installation instructions](https://github.com/numtel/mysql-live-select#installation) for more details...

```bash
$ git clone https://github.com/numtel/meteor-mysql-leaderboard.git
$ cd meteor-mysql-leaderboard

# Create new database
$ mysql -uUSERNAME -pPASSWORD -e "create database leaderboard"

# Import sample tables and data
$ mysql -uUSERNAME -pPASSWORD DATABASE < leaderboard.sql

# Update database connection settings in your favorite editor
$ ed leaderboard.js

$ meteor
```
