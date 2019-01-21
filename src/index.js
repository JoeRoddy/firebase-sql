require("@babel/polyfill");
import executeQuery from "./execute";

class FbSql {
  constructor() {
    this.database = null;
    this.isAdmin = false;
    this.isFirestore = false;
    this.shouldCommitResults = true;
    this.shouldExpandResults = false;
  }

  /**
   * @param {object} params - fbsql configuration
   * @param {object} [params.database] your firebase database instance
   * @param {boolean} [params.isAdmin] run queries with firebase-admin? (node only)
   * @param {boolean} [params.isFirestore] run queries against firestore?
   * @param {boolean} [params.shouldCommitResults] commit results on inserts, updates, deletes?
   * @param {boolean} [params.shouldExpandResults] return query info other than payload?
   */
  configure = params => {
    params &&
      Object.keys(params).forEach(key => {
        const val = params[key];
        if (val || val === false) {
          this[key] = val;
        }
      });
  };

  killListeners = () => {};

  getConfig = () => {
    return {
      database: this.database,
      isAdmin: this.isAdmin,
      isFirestore: this.isFirestore,
      shouldCommitResults: this.shouldCommitResults,
      shouldExpandResults: this.shouldExpandResults
    };
  };

  /**
   * @param {string} query - SQL query to execute against firebase
   * @param {function} [callback] - optional results callback, applies a listener
   * @returns {Promise} Promise object with results
   */
  execute = (query, callback) => {
    if (!query)
      throw new Error(
        `Must provide a string query argument, ie: execute("SELECT * FROM users")`
      );
    executeQuery(query, this.database, callback, false);
  };
}

let fbsql = new FbSql();

const { configure: configureFbsql, getConfig } = fbsql;

export { configureFbsql, getConfig };
export default fbsql.execute;

/** API
 *
 *  import fbsql, {configureFbsql} from "fbsql";
 *
 *  configureFbsql({ isAdmin: true, isFirestore:true });
 *  fbSql("select * from users");
 *
 */
