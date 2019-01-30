import stringHelper from "../helpers/string_helper";
import {
  SELECT_STATEMENT,
  UPDATE_STATEMENT,
  INSERT_STATEMENT,
  DELETE_STATEMENT,
  NO_EQUALITY_STATEMENTS
} from "../constants";
import { getConfig } from "../index";
import executeSelect from "../query_runners/select";
import executeQuery from "../execute";

class QueryParser {
  formatAndCleanQuery(query) {
    query = stringHelper.replaceAll(query, /(\/\/|--).+/, "");
    query = query.replace(/\r?\n|\r/g, " ");
    query = query.trim();
    query = this.removeWrappedParenthesis(query);
    return query;
  }

  removeWrappedParenthesis(query) {
    return /^\(.+\)$/.test(query)
      ? query.substring(1, query.length - 1)
      : query;
  }

  determineStatementType(query) {
    let q = query.trim();
    let firstTerm = q
      .split(" ")[0]
      .trim()
      .toLowerCase();
    switch (firstTerm) {
      case "select":
        return SELECT_STATEMENT;
      case "update":
        return UPDATE_STATEMENT;
      case "insert":
        return INSERT_STATEMENT;
      case "delete":
        return DELETE_STATEMENT;
      default:
        return SELECT_STATEMENT;
    }
  }

  getWheres(query, callback) {
    const whereIndexStart = query.toUpperCase().indexOf(" WHERE ") + 1;
    if (whereIndexStart < 1) {
      return callback(null);
    }
    const orderByIndex = query.toUpperCase().indexOf("ORDER BY");
    const whereIndexEnd = orderByIndex >= 0 ? orderByIndex : query.length;
    let wheresArr = query
      .substring(whereIndexStart + 5, whereIndexEnd)
      .split(/\sand\s/i);
    wheresArr[wheresArr.length - 1] = wheresArr[wheresArr.length - 1].replace(
      ";",
      ""
    );
    let wheres = [];
    wheresArr.forEach(where => {
      where = stringHelper.replaceAllIgnoreCase(where, "not like", "!like");
      let eqCompAndIndex = this.determineComparatorAndIndex(where);
      let whereObj = {
        field: stringHelper.replaceAll(
          where.substring(0, eqCompAndIndex.index).trim(),
          "\\.",
          "/"
        ),
        comparator: eqCompAndIndex.comparator
      };
      const comparatorLength =
        eqCompAndIndex.comparator == "=="
          ? 1
          : eqCompAndIndex.comparator.length;
      const unparsedVal = where
        .substring(eqCompAndIndex.index + comparatorLength)
        .trim();
      let val = stringHelper.getParsedValue(unparsedVal);
      const isFirestore = getConfig().isFirestore;
      if (
        typeof val === "string" &&
        val.charAt(0) === "(" &&
        val.charAt(val.length - 1) === ")"
      ) {
        executeSelect(val.substring(1, val.length - 1), results => {
          whereObj.value = results.payload;
          wheres.push(whereObj);
          if (wheresArr.length === wheres.length) {
            return callback(this.optimizeWheres(wheres, isFirestore));
          }
        });
      } else {
        whereObj.value = val;
        wheres.push(whereObj);
        if (wheresArr.length === wheres.length) {
          return callback(this.optimizeWheres(wheres, isFirestore));
        }
      }
    });
  }

  async getSets(query) {
    const setIndexStart = query.indexOf(" set ") + 1;
    if (setIndexStart < 1) {
      return null;
    }
    const whereIndexStart = query.indexOf(" where ") + 1;
    let setsArr;
    if (whereIndexStart > 0) {
      setsArr = query.substring(setIndexStart + 3, whereIndexStart).split(", ");
    } else {
      setsArr = query.substring(setIndexStart + 3).split(", ");
      setsArr[setsArr.length - 1] = setsArr[setsArr.length - 1].replace(
        ";",
        ""
      );
    }
    let sets = {};
    setsArr.forEach(async item => {
      let [key, val] = item.split("=");
      if (key && val) {
        //set based on select data: update users set field = select field from users.id;
        if (/^\s*\(?(select).+from.+\)?/i.test(val)) {
          val = await executeQuery(val);
        }
        key = key.replace(".", "/").trim();
        sets[key] = stringHelper.getParsedValue(val.trim(), true);
      }
    });
    return sets;
  }

  getOrderBys(query) {
    let caps = query.toUpperCase();
    const ORDER_BY = "ORDER BY";
    let index = caps.indexOf(ORDER_BY);
    if (index < 0) {
      return null;
    }
    let orderByStr = query.substring(index + ORDER_BY.length);
    let split = orderByStr.split(",");
    let orderBys = split.map(orderBy => {
      let propToSort = orderBy.replace(";", "").trim();
      propToSort =
        propToSort.indexOf(" ") >= 0
          ? propToSort.substring(0, propToSort.indexOf(" "))
          : propToSort;
      let orderByObj = {
        ascending: true,
        propToSort: propToSort.trim()
      };
      if (orderBy.toUpperCase().includes("DESC")) {
        orderByObj.ascending = false;
      }
      return orderByObj;
    });
    return orderBys;
  }

  getCollection(q, statementType) {
    let query = q.replace(/\(.*\)/, "").trim(); //removes nested selects
    let terms = query.split(" ");
    const { stripEncasingSlashes: strip } = stringHelper;
    if (statementType === UPDATE_STATEMENT) {
      return strip(stringHelper.replaceAll(terms[1], /\./, "/"));
    } else if (statementType === SELECT_STATEMENT) {
      if (terms.length === 2 && terms[0] === "from") {
        return strip(stringHelper.replaceAll(terms[1], ".", "/"));
      } else if (terms.length === 1) {
        let collection = terms[0].replace(";", "");
        return strip(stringHelper.replaceAll(collection, /\./, "/"));
      }
      let collectionIndexStart = query.indexOf("from ") + 4;
      if (collectionIndexStart < 0) {
        throw "Error determining collection.";
      }
      if (collectionIndexStart < 5) {
        return strip(stringHelper.replaceAll(terms[0], /\./, "/"));
      }
      let trimmedCol = query.substring(collectionIndexStart).trim();
      let collectionIndexEnd = trimmedCol.match(/\ |;|$/).index;
      let collection = trimmedCol.substring(0, collectionIndexEnd);
      return strip(stringHelper.replaceAll(collection, /\./, "/"));
    } else if (statementType === INSERT_STATEMENT) {
      let collectionToInsert =
        terms[1].toUpperCase() === "INTO" ? terms[2] : terms[3];
      return strip(stringHelper.replaceAll(collectionToInsert, /\./, "/"));
    } else if (statementType === DELETE_STATEMENT) {
      let index = terms.length > 2 ? 2 : 1;
      let term = stringHelper.replaceAll(terms[index], /;/, "");
      return strip(stringHelper.replaceAll(term, /\./, "/"));
    }
    throw "Error determining collection.";
  }

  getSelectedFields(q) {
    let query = q.trim();
    if (!query.startsWith("select ") || query.startsWith("select *")) {
      return null;
    }
    let regExp = /(.*select\s+)(.*)(\s+from.*)/;
    let froms = query.replace(regExp, "$2");
    if (froms.length === query.length) {
      return null;
    }
    let fields = froms.split(",");
    if (fields.length === 0) {
      return null;
    }
    let selectedFields = {};
    fields.map(field => {
      selectedFields[field.trim()] = true;
    });
    return selectedFields;
  }

  getObjectsFromInsert(query, callback) {
    // const shouldApplyListener = getConfig().shouldCommitResults;

    //insert based on select data
    if (/^(insert into )[^\s]+( select).+/i.test(query)) {
      const selectStatement = query
        .substring(query.toUpperCase().indexOf("SELECT "))
        .trim();
      executeSelect(selectStatement, selectData => {
        return callback(selectData.payload || selectData);
      });
    } else {
      //traditional insert
      let keysStr = query.substring(query.indexOf("(") + 1, query.indexOf(")"));
      let keys = keysStr.split(",");
      let valuesStr = query.match(/(values).+\)/)[0];
      let valuesStrArr = valuesStr.split(/[\(](?!\))/); //splits on "(", unless its a function "func()"
      valuesStrArr.shift(); //removes "values ("
      let valuesArr = valuesStrArr.map(valueStr => {
        return valueStr.substring(0, valueStr.lastIndexOf(")")).split(",");
      });
      if (!keys || !valuesArr) {
        throw "Badly formatted insert statement";
      }
      let insertObjects = {};
      valuesArr.forEach((values, valuesIndex) => {
        let insertObject = {};
        keys.forEach((key, keyIndex) => {
          insertObject[
            stringHelper.getParsedValue(key.trim())
          ] = stringHelper.getParsedValue(values[keyIndex].trim());
        });
        insertObjects["pushId_" + valuesIndex] = insertObject;
      });

      return callback(insertObjects);
    }
  }

  determineComparatorAndIndex(where) {
    let notEqIndex = this.getNotEqualIndex(where);
    if (notEqIndex >= 0) {
      return { comparator: "!=", index: notEqIndex };
    }

    let greaterThanEqIndex = where.indexOf(">=");
    if (greaterThanEqIndex >= 0) {
      return { comparator: ">=", index: greaterThanEqIndex };
    }

    let greaterThanIndex = where.indexOf(">");
    if (greaterThanIndex >= 0) {
      return { comparator: ">", index: greaterThanIndex };
    }

    let lessThanEqIndex = where.indexOf("<=");
    if (lessThanEqIndex >= 0) {
      return { comparator: "<=", index: lessThanEqIndex };
    }
    let lessThanIndex = where.indexOf("<");
    if (lessThanIndex >= 0) {
      return { comparator: "<", index: lessThanIndex };
    }

    let notLikeIndex = where.toLowerCase().indexOf("!like");
    if (notLikeIndex >= 0) {
      return { comparator: "!like", index: notLikeIndex };
    }

    let likeIndex = where.toLowerCase().indexOf("like");
    if (likeIndex >= 0) {
      return { comparator: "like", index: likeIndex };
    }

    let eqIndex = where.indexOf("=");
    if (eqIndex >= 0) {
      return { comparator: "==", index: eqIndex };
    }

    throw "Unrecognized comparator in where clause: '" + where + "'.";
  }

  getInsertCount(query) {
    const splitQ = query.trim().split(" ");
    if (splitQ[0].toUpperCase() === "INSERT" && parseInt(splitQ[1]) > 1) {
      return parseInt(splitQ[1]);
    }
    return 1;
  }

  getNotEqualIndex(condition) {
    return stringHelper.regexIndexOf(condition, /!=|<>/);
  }

  optimizeWheres(wheres, isFirestore) {
    const queryableComparators = isFirestore
      ? ["==", "<", "<=", ">", ">="]
      : ["=="];

    //rearranges wheres so first statement is an equal, or error if no equals
    //firebase has no != method, so we'll grab whole collection, and filter on client
    const firstNotEqStatement = wheres[0];
    for (let i = 0; i < wheres.length; i++) {
      if (
        wheres[i].value != null &&
        queryableComparators.includes(wheres[i].comparator)
      ) {
        wheres[0] = wheres[i];
        wheres[i] = firstNotEqStatement;
        return wheres;
      }
    }

    wheres.unshift({ error: NO_EQUALITY_STATEMENTS });
    return wheres;
  }

  checkForCrossDbQuery(collection) {
    let isFirestore = getConfig().isFirestore;
    if (/(db|firestore)/i.test(collection)) {
      if (
        // only flip the db if it's not already enabled
        (isFirestore && /(db)/i.test(collection)) ||
        (!isFirestore && /(firestore)/i.test(collection))
      ) {
        isFirestore = !isFirestore;
      }
      collection = collection.substring(collection.indexOf("/") + 1);
      if (collection === "db" || collection === "firestore") {
        collection = "/";
      }
    }
    return { collection, isFirestore };
  }
}

const querParser = new QueryParser();
export default querParser;
