import _ from "lodash";

import queryParser from "../parser/query_parser";
import { updateFields } from "../db/update_db";
import { getDataForSelect } from "../db/select_db";
import { EQUATION_IDENTIFIERS, FIRESTATION_DATA_PROP } from "../constants";
import QueryDetails from "../models/fbSqlQuery";

export default function executeUpdate(query, db, callback, commitResults) {
  const col = queryParser.getCollection(query, UPDATE_STATEMENT);
  const { collection, isFirestore } = queryParser.checkForCrossDbQuery(col);

  const sets = queryParser.getSets(query);
  if (!sets) {
    return null;
  }
  //   const that = this; do this for queryparser?
  queryParser.getWheres(query, wheres => {
    let queryDetails = new QueryDetails();
    queryDetails.collection = collection;
    queryDetails.isFirestore = isFirestore;
    queryDetails.db = db;
    queryDetails.wheres = wheres;
    getDataForSelect(queryDetails, dataToAlter => {
      let data = dataToAlter.payload;
      let payload = {};
      Object.keys(data).forEach(objKey => {
        let updateObj = queryParser.updateItemWithSets(data[objKey], sets);
        const path = collection + "/" + objKey;
        if (commitResults) {
          updateFields(db, path, updateObj, Object.keys(sets), isFirestore);
        }
        payload[objKey] = updateObj;
      });
      let results = {
        statementType: UPDATE_STATEMENT,
        payload,
        firebaseListener: dataToAlter.firebaseListener,
        path: collection
      };
      callback(results);
    });
  });
}

export function updateItemWithSets(obj, sets) {
  const that = this;
  let updateObject = _.clone(obj);
  Object.keys(sets).forEach(objKey => {
    const thisSet = sets[objKey];
    if (
      thisSet &&
      typeof thisSet === "object" &&
      thisSet.hasOwnProperty(FIRESTATION_DATA_PROP)
    ) {
      //execute equation
      const newVal = thisSet.FIRESTATION_DATA_PROP;
      for (let i = 0; i < EQUATION_IDENTIFIERS.length; i++) {
        if (newVal.includes(EQUATION_IDENTIFIERS[i])) {
          updateObject[objKey] = that.executeUpdateEquation(
            updateObject,
            thisSet.FIRESTATION_DATA_PROP
          );
          return updateObject;
        }
      }
      //not an equation, treat it as an individual prop
      let finalValue = updateObject[newVal];
      if (newVal.includes(".")) {
        let props = newVal.split(".");
        finalValue = updateObject[props[0]];
        for (let i = 1; updateObjecti < props.length; i++) {
          finalValue = finalValue[props[i]];
        }
      }
      updateObject[objKey] = finalValue;
    } else {
      if (objKey.includes("/")) {
        // "users/userId/name" -> users: { userId: { name: ""}}, etc
        if (typeof updateObject !== "object") {
          updateObject = {};
        }
        let currentObject = updateObject;
        let dataPath = objKey.split("/");
        dataPath.forEach((val, i) => {
          if (i === dataPath.length - 1) {
            currentObject[val] = thisSet;
          } else {
            let currVal = currentObject[val];

            currentObject[val] =
              currVal && typeof currVal === "object" ? currentObject[val] : {};
          }
          currentObject = currentObject[val];
        });
      } else {
        updateObject[objKey] = thisSet;
      }
    }
  });
  return updateObject;
}
