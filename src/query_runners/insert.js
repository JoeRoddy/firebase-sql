import queryParser from "../parser/query_parser";
import { pushObject } from "../db/update_db";
import { INSERT_STATEMENT } from "../constants";
import { getConfig } from "..";

export default function executeInsert(query, callback) {
  const col = queryParser.getCollection(query, INSERT_STATEMENT);
  const { collection, isFirestore } = queryParser.checkForCrossDbQuery(col);
  const insertCount = queryParser.getInsertCount(query);
  const path = collection + "/";
  const commitResults = getConfig().shouldCommitResults;

  return new Promise((resolve, reject) => {
    queryParser.getObjectsFromInsert(query, async insertObjects => {
      if (commitResults) {
        let keys = insertObjects && Object.keys(insertObjects);
        const insertPromises = [];
        for (let i = 1; i < insertCount; i++) {
          //insert clones
          const prom = pushObject(path, insertObjects[keys[0]], isFirestore);
          insertPromises.push(prom);
        }
        for (let key in insertObjects) {
          const prom = pushObject(path, insertObjects[key], isFirestore);
          insertPromises.push(prom);
        }
        await Promise.all(insertPromises);
      }
      let results = {
        insertCount: insertCount,
        statementType: INSERT_STATEMENT,
        payload: insertObjects,
        path: path
      };

      if (callback) callback(results);
      else {
        resolve(results);
      }
    });
  });
}
