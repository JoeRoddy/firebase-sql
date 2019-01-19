import queryParser from "../parser/query_parser";
import { deleteObject } from "../db/update_db";
import { getDataForSelect } from "../db/select_db";
import QueryDetails from "../models/fbSqlQuery";

export default function executeDelete(query, db, callback, commitResults) {
  const col = queryParser.getCollection(query, DELETE_STATEMENT);
  const { collection, isFirestore } = queryParser.checkForCrossDbQuery(col);
  queryParser.getWheres(query, wheres => {
    let queryDetails = new QueryDetails();
    queryDetails.collection = collection;
    queryDetails.isFirestore = isFirestore;
    queryDetails.db = db;
    queryDetails.wheres = wheres;
    getDataForSelect(queryDetails, dataToAlter => {
      if (dataToAlter && commitResults) {
        Object.keys(dataToAlter.payload).forEach(objKey => {
          const path = collection + "/" + objKey;
          deleteObject(db, path, isFirestore);
        });
      }
      let results = {
        statementType: DELETE_STATEMENT,
        payload: dataToAlter.payload,
        firebaseListener: dataToAlter.firebaseListener,
        path: collection
      };
      callback(results);
    });
  });
}
