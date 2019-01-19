import * as admin from "firebase-admin";
import config from "./db_config";

const { databaseURL, serviceAccount } = config;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL
});

export const clearDb = () => {
  return admin
    .database()
    .ref("/")
    .set(null);
};

export const injectData = (path, data) => {
  return admin
    .database()
    .ref(path)
    .set(data);
};
