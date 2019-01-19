import queryParser from "../parser/query_parser";
import { getDataForSelect } from "../db/select_db";
import QueryDetails from "../models/fbSqlQuery";
import { SELECT_STATEMENT } from "../constants";
import { getConfig } from "../index";

export default function executeSelect(query, callback) {
  const col = queryParser.getCollection(query, SELECT_STATEMENT);
  const { collection, isFirestore } = queryParser.checkForCrossDbQuery(col);

  let queryDetails = new QueryDetails();
  queryDetails.collection = collection;
  queryDetails.isFirestore = isFirestore;
  queryDetails.orderBys = queryParser.getOrderBys(query);
  queryDetails.selectedFields = queryParser.getSelectedFields(query);
  queryDetails.shouldApplyListener = true;

  queryParser.getWheres(query, wheres => {
    queryDetails.wheres = wheres;
    getDataForSelect(queryDetails, results => {
      const response = getConfig().shouldExpandResults
        ? results
        : results.payload;
      callback(response);
    });
  });
}
