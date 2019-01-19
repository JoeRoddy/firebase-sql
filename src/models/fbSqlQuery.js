export default class FbSqlQuery {
  constructor() {
    this.rawQuery = null;
    this.collection = null;
    this.path = null;
    this.selectedFields = null;
    this.wheres = null;
    this.orderBys = null;
    this.isFirestore = false;
    this.shouldApplyListener = false;
    this.shouldCommitResults = false;
  }
}
