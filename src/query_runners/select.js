import queryParser from "../parser/query_parser";
import { getDataForSelect, getDataForSelectAsync } from "../db/select_db";
import QueryDetails from "../models/fbSqlQuery";
import { SELECT_STATEMENT } from "../constants";
import { getConfig } from "../index";

export default function executeSelect(
  query,
  callback,
  shouldApplyListener = true
) {
  const col = queryParser.getCollection(query, SELECT_STATEMENT);
  const { collection, isFirestore } = queryParser.checkForCrossDbQuery(col);

  let queryDetails = new QueryDetails();
  queryDetails.collection = collection;
  queryDetails.isFirestore = isFirestore;
  queryDetails.orderBys = queryParser.getOrderBys(query);
  queryDetails.selectedFields = queryParser.getSelectedFields(query);
  queryDetails.shouldApplyListener =
    callback && shouldApplyListener ? true : false;

  return new Promise((resolve, reject) => {
    queryParser.getWheres(query, async wheres => {
      queryDetails.wheres = wheres;
      if (callback) {
        getDataForSelect(queryDetails, results => {
          callback(customizeResults(results));
        });
      } else {
        const results = await getDataForSelectAsync(queryDetails);
        resolve(customizeResults(results));
      }
    });
  });
}

const customizeResults = results =>
  getConfig().shouldExpandResults ? results : results.payload;
