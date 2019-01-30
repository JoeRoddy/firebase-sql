import * as admin from "firebase-admin";

import stringHelper from "../helpers/string_helper";
// import { startFirebaseApp } from "./FirebaseDb";

let app = admin;

const updateFields = function(path, object, fields, isFirestore) {
  if (!fields || !object) {
    return;
  }
  // const app = startFirebaseApp(savedDatabase);
  return isFirestore
    ? updateFirestoreFields(app.firestore(), path, object, fields)
    : updateRealtimeFields(app.database(), path, object, fields);
};

const updateRealtimeFields = function(db, path, newData, fields) {
  let updateObject = {};
  fields.forEach(field => {
    updateObject[field] = newData[field];
  });

  return db.ref(path).update(updateObject);
};

const updateFirestoreFields = function(db, path, object, fields) {
  let [col, doc] = path.split(/\/(.+)/); // splits only on first '/' char

  return db
    .collection(col)
    .doc(doc)
    .set(object);
};

const deleteObject = function(path, isFirestore) {
  return isFirestore
    ? deleteFirestoreData(app.firestore(), path)
    : app
        .database()
        .ref(path)
        .remove();
};

const deleteFirestoreData = function(db, path) {
  let [collection, doc] = path.split(/\/(.+)/); //splits on first "/"
  return doc.includes("/")
    ? deleteFirestoreField(db, collection, doc)
    : deleteFirestoreDoc(db, collection, doc);
};

const deleteFirestoreDoc = function(db, collection, doc) {
  return db
    .collection(collection)
    .doc(doc)
    .delete();
};

const deleteFirestoreField = function(db, collection, docAndField) {
  let [doc, field] = docAndField.split(/\/(.+)/);
  field = stringHelper.replaceAll(field, "/", ".");
  return db
    .collection(collection)
    .doc(doc)
    .update({
      [field]: admin.firestore.FieldValue.delete()
    });
};

const pushObject = function(path, object, isFirestore) {
  return isFirestore
    ? createFirestoreDocument(app.firestore(), path, object)
    : app
        .database()
        .ref(path)
        .push(object);
};

const createFirestoreDocument = function(db, path, data) {
  let [collection, docId] = path.split(/\/(.+)/);
  return docId
    ? setFirestoreDocWithExplicitId(db, collection, docId, data)
    : pushFirestoreDocToGeneratedId(db, collection, data);
};

const setFirestoreDocWithExplicitId = function(db, collection, docId, data) {
  return db
    .collection(collection)
    .doc(docId)
    .set(data);
};

const pushFirestoreDocToGeneratedId = function(db, collection, data) {
  collection = collection.replace(/\/+$/, ""); //remove trailing "/"
  return db.collection(collection).add(data);
};

const set = function(savedDatabase, path, data, isFirestore) {
  const app = startFirebaseApp(savedDatabase);
  const db = isFirestore ? app.firestore() : app.database();
  if (isFirestore) {
    let [collection, docId] = path.split(/\/(.+)/);
    docId.includes("/")
      ? setFirestoreProp(db, path, data)
      : setFirestoreDocWithExplicitId(db, collection, docId, data);
  } else {
    db.ref(path).set(data);
  }
};

const setObjectProperty = function(savedDatabase, path, value, isFirestore) {
  value = stringHelper.getParsedValue(value);
  const app = startFirebaseApp(savedDatabase);
  isFirestore
    ? setFirestoreProp(app.firestore(), path, value)
    : app
        .database()
        .ref(path)
        .set(value);
};

const setFirestoreProp = function(db, path, value) {
  path = path.charAt(0) === "/" && path.length > 1 ? path.substring(1) : path;
  path = stringHelper.replaceAll(path, "/", ".");
  let [collection, docAndField] = path.split(/\.(.+)/);
  let [docId, field] = docAndField.split(/\.(.+)/);
  if (!field) {
    //trying to create a new doc from obj tree
    return createFirestoreDocument(db, collection, { [docId]: value });
  }
  db.collection(collection)
    .doc(docId)
    .update({
      [field]: value
    });
};

export { deleteObject, set, setObjectProperty, pushObject, updateFields };
