import queryParser from "../parser/query_parser";
import { pushObject } from "../db/update_db";

export default function executeInsert(query, db, callback, commitResults) {
  const col = queryParser.getCollection(query, INSERT_STATEMENT);
  const { collection, isFirestore } = queryParser.checkForCrossDbQuery(col);
  const insertCount = queryParser.getInsertCount(query);
  const path = collection + "/";
  queryParser.getObjectsFromInsert(query, insertObjects => {
    if (commitResults) {
      let keys = insertObjects && Object.keys(insertObjects);
      for (let i = 1; i < insertCount; i++) {
        //insert clones
        pushObject(db, path, insertObjects[keys[0]], isFirestore);
      }
      for (let key in insertObjects) {
        pushObject(db, path, insertObjects[key], isFirestore);
      }
    }
    let results = {
      insertCount: insertCount,
      statementType: INSERT_STATEMENT,
      payload: insertObjects,
      path: path
    };
    callback(results);
  });
}
