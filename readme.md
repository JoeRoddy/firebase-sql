# Firebase SQL

The Firebase SQL library accepts standard SQL queries and executes them as corresponding Firebase queries.

```javascript
import fbsql from "fbsql";

// async:
const codingBlogs = await fbsql(`select * from blogs where genre = "coding";`);
// or apply a listener:
fbsql(`select * from users where online = true;`, onlineUsers => {
  //...
});
```

## Installation

```bash
npm install --save fbsql
```

Queries should work out of the box as long as you've configured firebase with `firebase.initializeApp()`

## Wait, but why?

Fbsql was extracted from the [Firestation desktop app's](https://github.com/JoeRoddy/firestation/) source code to make issue tracking easier.

This library may be useful for:

- Developers who prefer SQL syntax to the Firebase APIs
- Building admin tools for managing your database
- Saving time writing complicated functions that could be achieved with a one line SQL statement

- Improving code clarity:

```js
// firebase-sql
const codingBlogs = await fbsql(`select * from blogs where genre = "coding";`);

// firebase (realtime db)
const snapshot = await firebase
  .database()
  .ref("/blogs/")
  .orderByChild("genre")
  .equalTo("coding")
  .once("value");
const codingBlogs = snapshot.val();

// firebase (firestore)
const doc = await db
  .firestore()
  .collection("blogs")
  .where("genre", "==", "coding")
  .get();
const codingBlogs = doc.data();
```

## Configuration

You have multiple configuration options through the `configureFbsql` function:

```javascript
import fbsql, { configureFbsql } from "fbsql";

// pass any number of options
// below are the defaults
configureFbsql({
  isAdmin: false, // use firebase-admin? (node)
  isFirestore: false, // use firestore instead of the realtime db?
  database: null, // TODO:
  shouldCommitResults: true, // commit changes on inserts, updates, deletes?
  shouldExpandResults: false // return a more detailed res obj from queries?
});
```
