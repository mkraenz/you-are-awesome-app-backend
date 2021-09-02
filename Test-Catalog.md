# Test Catalog

## sub push notif

Precondition: none

Test cases:

- When invoked with invalid expoPushToken but rest is valid, errors with BadRequest (Expect: 400)
- When invoked with invalid hour but rest is valid, errors with BadRequest (Expect: 400)
- When invoked with invalid minute but rest is valid, errors with BadRequest (Expect: 400)
- When invoked with valid token + hour + minute, it creates an entry in the subs table. (Expect: 201 + data in db)
- When invoked again with same data, it overwrites the previous entry instead of creating a new one. (Expect: 201 + data unchanged in db, no 2nd entry)
- When invoked again with different data, it overwrites the previous entry with the new data (Expect: 201 + data changed, no 2nd entry)

## unsub push notif

Precondition: A sub `expoPushToken: ExponentPushToken[12345], time: 23:59` in the subs table

Test cases:

- When invoked with invalid expoPushToken, errors with BadRequest (Expect: 400)
- When invoked and sub does not exist, it does nothing (Expect: 200 + no changes to existing entry)
- When invoked with valid expoPushToken and sub exists, it deletes the entry. (Expect: 200 + no entries in db)
- When invoked again with valid expoPushToken and sub exists, it does nothing. (Expect: 200 + no entries in db, no errors)
