import queryParser from "../parser/query_parser";
import { deleteObject } from "../db/update_db";
import { getDataForSelectAsync } from "../db/select_db";
import QueryDetails from "../models/fbSqlQuery";
import { DELETE_STATEMENT } from "../constants";
import { getConfig } from "..";

//TODO: refactor this away from firestation use case
// no need to grab the data first > commit for most ppl
export default function executeDelete(query, callback) {
  const col = queryParser.getCollection(query, DELETE_STATEMENT);
  const { collection, isFirestore } = queryParser.checkForCrossDbQuery(col);
  const commitResults = getConfig().shouldCommitResults;

  return new Promise((resolve, reject) => {
    queryParser.getWheres(query, async wheres => {
      let queryDetails = new QueryDetails();
      queryDetails.collection = collection;
      queryDetails.isFirestore = isFirestore;
      queryDetails.wheres = wheres;

      const { payload, firebaseListener } = await getDataForSelectAsync(
        queryDetails
      );
      if (payload && commitResults) {
        if (["boolean", "number", "string"].includes(typeof payload)) {
          // path is a non-obj data prop, ie: delete from users.userId.height;
          deleteObject(collection, isFirestore);
        } else {
          Object.keys(payload).forEach(objKey => {
            const path = collection + "/" + objKey;
            deleteObject(path, isFirestore);
          });
        }
      }
      let results = {
        statementType: DELETE_STATEMENT,
        payload: payload,
        firebaseListener: firebaseListener,
        path: collection
      };
      callback ? callback(results) : resolve(results);
    });
  });
}
