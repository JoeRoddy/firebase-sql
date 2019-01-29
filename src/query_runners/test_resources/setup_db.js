import * as admin from "firebase-admin";
import config from "./db_config";
import executeQuery from "../../execute";
import { configureFbsql } from "../..";

const { databaseURL, serviceAccount } = config;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL
});

export const clearDb = async isFirestore => {
  return isFirestore
    ? deleteFirestore()
    : admin
        .database()
        .ref("/")
        .set(null);
};

export const injectData = (path, data, isFirestore) => {
  return isFirestore
    ? injectIntoFirestore(path, data)
    : admin
        .database()
        .ref(path)
        .set(data);
};

const injectIntoFirestore = (path, data) => {
  const db = admin.firestore();
  const batch = db.batch();

  data &&
    Object.keys(data).forEach(docTitle => {
      batch.set(db.collection(path).doc(docTitle), data[docTitle]);
    });
  return batch.commit();
};

const deleteFirestore = async () => {
  configureFbsql({ isFirestore: true });
  const rootData = await executeQuery("select * from /");
  const db = admin.firestore();
  const batch = db.batch();
  rootData &&
    Object.keys(rootData).forEach(colKey => {
      const collectionData = rootData[colKey];
      collectionData &&
        Object.keys(collectionData).forEach(docId => {
          batch.delete(db.collection(colKey).doc(docId));
        });
    });
  return batch.commit();
};
