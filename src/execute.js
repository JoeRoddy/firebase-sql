import queryParser from "./parser/query_parser";
import executeSelect from "./query_runners/select";
import executeDelete from "./query_runners/delete";
import executeUpdate from "./query_runners/update";
import executeInsert from "./query_runners/insert";

import {
  SELECT_STATEMENT,
  UPDATE_STATEMENT,
  INSERT_STATEMENT,
  DELETE_STATEMENT
} from "./constants";

export default function executeQuery(query, callback) {
  query = queryParser.formatAndCleanQuery(query);
  const statementType = queryParser.determineStatementType(query);

  switch (statementType) {
    case SELECT_STATEMENT:
      return executeSelect(query, callback);
    case UPDATE_STATEMENT:
      return executeUpdate(query, callback);
    case DELETE_STATEMENT:
      return executeDelete(query, callback);
    case INSERT_STATEMENT:
      return executeInsert(query, callback);
    default:
  }
}
