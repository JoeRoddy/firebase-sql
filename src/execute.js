import queryParser from "./parser/query_parser";
import executeSelect from "./query_runners/select";
import executeDelete from "./query_runners/delete";
import executeUpdate from "./query_runners/update";
import {
  SELECT_STATEMENT,
  UPDATE_STATEMENT,
  INSERT_STATEMENT,
  DELETE_STATEMENT
} from "./constants";

import { getConfig } from "../src/index";

export default function executeQuery(query, db, callback) {
  query = queryParser.formatAndCleanQuery(query);
  const statementType = queryParser.determineStatementType(query);
  const { shouldCommitResults } = getConfig();

  switch (statementType) {
    case SELECT_STATEMENT:
      return executeSelect(query, callback);
    case UPDATE_STATEMENT:
      return executeUpdate(query, db, callback, shouldCommitResults);
    case DELETE_STATEMENT:
      return executeDelete(query, db, callback, shouldCommitResults);
    case INSERT_STATEMENT:
      return executeInsert(query, db, callback, shouldCommitResults);
    default:
  }
}
