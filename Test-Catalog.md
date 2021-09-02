# Test Catalog

## sub push notif

Precondition: none

Test cases:

- When invoked with invalid expoPushToken but rest is valid, errors with BadRequest (Expect: 400)
- When invoked with invalid hour but rest is valid, errors with BadRequest (Expect: 400)
- When invoked with invalid minute but rest is valid, errors with BadRequest (Expect: 400)
- When invoked with valid token + hour + minute, it creates an entry in the subs table. (Expect: 200 + data in db)
- When invoked again with same data, it overwrites the previous entry instead of creating a new one. (Expect: 200 + data unchanged in db, no 2nd entry)
- When invoked again with different data, it overwrites the previous entry with the new data (Expect: 200 + data changed, no 2nd entry)

## unsub push notif

Precondition: A sub `expoPushToken: ExponentPushToken[12345], time: 23:59` in the subs table

Test cases:

- When invoked with invalid expoPushToken, errors with BadRequest (Expect: 400)
- When invoked and sub does not exist, it does nothing (Expect: 200 + no changes to existing entry)
- When invoked with valid expoPushToken and sub exists, it deletes the entry. (Expect: 200 + no entries in db)
- When invoked again with valid expoPushToken and sub exists, it does nothing. (Expect: 200 + no entries in db, no errors)

## send push notif

Test cases:

<!-- TODO #535 write properly + automate -->

- does nothing if no subs for given time
- sends a push notif at time x, if sub exists for that time x

## handle success tickets for push notifs

Test cases:

<!-- TODO #535 write properly + automate -->

- does nothing if no success tickets exist in db
- deletes corresponding success tickets if expo returns success receipts
- unsubs from push notifs if device not registered
