# numtel:mysql-select

Reactively bind MySQL Select statements to Mongo Collections

Includes the [MySQL NPM module](https://www.npmjs.org/package/mysql).

Combine the `mysqlSyncSelect()` method on your collections (server-side) with the `mysqlInitTriggers()` method to read data from MySQL in Meteor reactively.

## Implements

### `Collection.prototype.mysqlSyncSelect(...)`

Synchronize a collection's documents with rows from a select query.

Argument | Type | Description
--------|------|------------------
`conn`  | `object` | Connection object as returned from `mysql.createConnection()`
`updateTable` | `string` | Name of table to keep update timestamps
`triggers` | `[string]` | Array of trigger keys to cause query update
`query` | `string` or `function` | Select query to execute
`idField` | `string` | Name of field in select results to place as Mongo document `_id`, important for only updating changed documents reactively

### `mysqlInitTriggers(conn, updateTable, triggers, force)`

Create a table for storing trigger update timestamps (if not already existing) and install triggers on specified tables.

Argument | Type | Description
--------|------|------------------
`conn`  | `object` | Connection object as returned from `mysql.createConnection()`
`updateTable` | `string` | Name of table to keep update timestamps, will be created if does not exist
`triggers` | `array` | Description of triggers to intialize, described below
`force` | `boolean` | Automatically remove conflicting triggers, otherwise errors will be thrown on duplicates

#### Trigger descriptions

##### Simple

Supply a string to indicate a trigger that updates when any row on the table is inserted, updated or deleted. The trigger key and table name are both the same value.

##### Complex

Specify an object with the following properties:

Name | Type | Description
-----|-------| --------
`table` | `string` | Name of table to hook trigger *(Required)*
`key` | `string` | Trigger key referenced by synchronized select statements *(Optional, defaults to `table`)*
`condition` | `string` | Specify conditional terms to trigger *(Optional)* This value is not escaped. User input escape must be done separately. Access new row on insert or old row on update/delete using `$ROW` symbol. Example: `$ROW.name = "dude" or $ROW.score > 200`

### `mysqlQueryEx(conn, query)`

**Helper function** Perform a query synchronously, returning the result.

Argument | Type | Description
--------|------|------------------
`conn`  | `object` | Connection object as returned from `mysql.createConnection()`
`query` | `string` or `function` | Query to execute

If a function is passed to `query`, its arguments contain 2 functions:

* `escape` - Escape a database value
* `escapeId` - Escape a database identifier

Example:
```javascript
mysqlQueryEx(conn, function(escape, escapeId) {
  return 'SELECT * FROM ' + escapeId(table) +
          ' WHERE `score` > ' + escape(value);
});
```

