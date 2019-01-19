import executeQuery from "./execute";

class FbSql {
  constructor() {
    this.database = null;
    this.isAdmin = false;
    this.isFirestore = false;
    this.shouldCommitResults = false;
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
    const {
      database,
      isAdmin,
      isFirestore,
      shouldCommitResults,
      shouldExpandResults
    } = params;

    this.database = database || this.database;
    this.isAdmin = isAdmin || false;
    this.isFirestore = isFirestore || false;
    this.shouldCommitResults = shouldCommitResults || false;
    this.shouldExpandResults = shouldExpandResults || false;
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

    console.log("isFirestore?:", this.isFirestore);
    console.log("isAdming:", this.isAdmin);
    console.log("db:", this.database);
    console.log("shouldCommitResults:", this.shouldCommitResults);

    executeQuery(query, this.database, callback, false);
  };
}

let fbSql = new FbSql();

const { configure: configureFbsql, getConfig } = fbSql;

export { configureFbsql, getConfig };
export default fbSql.execute;

/** API
 *
 *  import fbsql, {configureFbsql} from "fbsql";
 *
 *  configureFbsql({ isAdmin: true, isFirestore:true });
 *  fbSql("select * from users");
 *
 */
