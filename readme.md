# Firebase SQL

The Firebase SQL library accepts standard SQL queries and executes them as corresponding Firebase queries.

```javascript
import fbsql from "fbsql";

// async:
const codingBlogs = await fbsql(`select * from blogs where genre = "coding";`);

// or apply a listener:
fbsql(`select * from users where online = true;`, onlineUsers => {
  // handle realtime updates...
});
```

## Installation

```bash
npm install --save fbsql
```

## Wait, but why?

Fbsql was extracted from the [Firestation desktop app's](https://github.com/JoeRoddy/firestation/) source code to make issue tracking easier.

This library may be useful for:

- Developers who prefer SQL syntax to the Firebase API
- Saving time writing complicated functions that could be achieved with a one line SQL statement
- Improving code clarity:

```js
// firebase-sql
const codingBlogs = await fbsql(`select * from blogs where genre = "coding";`);

// realtime db
const snapshot = await firebase
  .database()
  .ref("/blogs/")
  .orderByChild("genre")
  .equalTo("coding")
  .once("value");
const codingBlogs = snapshot.val();

// firestore
const doc = await firebase
  .firestore()
  .collection("blogs")
  .where("genre", "==", "coding")
  .get();
const codingBlogs = doc.data();
```

## Setup

Wherever you initialize firebase:

```js
import firebase from "firebase/app"; // import * as firebase from "firebase-admin";
import { configureFbsql } from "fbsql";

firebase.initializeApp({ your config... });
configureFbsql({ app: firebase });
```

If you run into errors saying `app.database() is not a function`, you may need to import firebase into the file causing the issue. `import firebase from "firebase/app";`

## Configuration

You have multiple configuration options through the `configureFbsql` function:

```javascript
import fbsql, { configureFbsql } from "fbsql";

// pass any combination of options
// below are the defaults
configureFbsql({
  app: null // your firebase app
  isFirestore: false, // use firestore instead of the realtime db?
  shouldCommitResults: true, // commit changes on inserts, updates, deletes?
  shouldExpandResults: false // return a more detailed res obj from queries?
});
```
