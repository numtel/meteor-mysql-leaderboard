# MySQL Leaderboard Example

In MySQL, triggers can not call the external environment without a UDF (user
defined function) that must be compiled for the individual machine.

Polling a table that is updated by triggers has been chosen as the method to update each
select statement instead of a potentially insecure UDF.

Explorations show that in Postgres, functions accessing external resources may be written using `plperlu` scripts but only as a super user.

## New packages

This example uses 2 packages to streamline MySQL integration:

* [numtel:mysql](https://github.com/numtel/meteor-mysql) - MySQL support with reactive Select statements
* [numtel:method-expectations](https://github.com/numtel/meteor-method-expectations) - Provide instantaneous feedback for `Meteor.methods()`.

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
