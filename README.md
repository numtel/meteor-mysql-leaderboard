# MySQL Leaderboard Example

The familiar Meteor Leaderboard example modified to use a MySQL backend, reactively!

This example uses the following new package for MySQL integration:

* [numtel:mysql](https://github.com/numtel/meteor-mysql)

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
