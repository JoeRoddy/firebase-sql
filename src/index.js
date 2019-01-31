require("@babel/polyfill");
import executeQuery from "./execute";

class FbSql {
  constructor() {
    this.app = null;
    this.isFirestore = false;
    this.shouldCommitResults = true;
    this.shouldExpandResults = false;
  }

  /**
   * @param {object} params - fbsql configuration
   * @param {object} [params.app] your firebase app
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
      app: this.app,
      isFirestore: this.isFirestore,
      shouldCommitResults: this.shouldCommitResults,
      shouldExpandResults: this.shouldExpandResults
    };
  };

  getApp = () => this.app;

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
    return executeQuery(query, callback, false);
  };
}

let fbsql = new FbSql();

const { configure: configureFbsql, getApp, getConfig } = fbsql;

export { configureFbsql, getConfig, getApp };
export default fbsql.execute;
