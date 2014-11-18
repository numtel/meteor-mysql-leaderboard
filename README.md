# MySQL Leaderboard Example

*Exploring reactive Meteor MySQL integration...*

In MySQL, triggers can not call the external environment without a UDF (user
defined function) that must be compiled for the individual machine.

Polling a table that is updated by triggers has been chosen as the method to update each
select statement instead of a potentially insecure UDF.

Explorations show that in Postgres, functions accessing external resources may be written using `plperlu` scripts but only as a super user.

## New packages

This example has spawned 2 experimental packages to streamline MySQL integration:

* [mysql-select](https://github.com/numtel/meteor-mysql-testing/tree/master/packages/numtel:mysql-select) - Synchronize a Mongo Collection with a MySQL Select statement
* [method-expectations](https://github.com/numtel/meteor-mysql-testing/tree/master/packages/numtel:method-expectations) - Provide instantaneous feedback for `Meteor.methods()`.

## Quick start

This example requires a MySQL server.

```bash
$ git clone https://github.com/numtel/meteor-mysql-leaderboard.git
$ cd meteor-mysql-leaderboard

# Import database (replace values)
$ mysql -uUSERNAME -pPASSWORD DATABASE < leaderboard.sql

# Update database connection settings in your favorite editor
$ ed leaderboard.js

$ meteor
```
