# Testing SQL with Meteor

Integrating Meteor with SQL reactively...

In MySQL, triggers can not call the external environment without a UDF (user
defined function) that must be compiled for the individual machine.

In Postgres, functions may be written using plperlu scripts but only as a super
user.

MySQL has been selected as a starting point due to greater previous experience.
Polling a table that is updated on triggers has been selected to update each
select statement instead of a potentially insecure UDF.

A 'Method Expections' package is planned to enable instantaneous client
feedback on inserts/updates/removes through Meteor methods.
