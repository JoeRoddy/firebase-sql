import queryParser from "../query_parser";
import {
  NO_EQUALITY_STATEMENTS,
  SELECT_STATEMENT,
  INSERT_STATEMENT,
  UPDATE_STATEMENT,
  DELETE_STATEMENT
} from "../../constants";
import { configureFbsql } from "../..";

test("clean comments", () => {
  const query = `
    // this is a comment
    select * from users; -- another comment
    -- delete from users;
    // who woulda guessed it? a comment`;
  const cleaned = queryParser.formatAndCleanQuery(query);
  expect(cleaned).toBe("select * from users;");
});

test("determine statement type", () => {
  const { determineStatementType: dst } = queryParser;
  // SELECT
  expect(dst(`select * from users;`)).toBe(SELECT_STATEMENT);
  expect(dst(`users.insert.xyz`)).toBe(SELECT_STATEMENT);
  expect(dst(`/`)).toBe(SELECT_STATEMENT);
  expect(dst(`.`)).toBe(SELECT_STATEMENT);
  // INSERT
  expect(dst(`insert into x (a) values 1;`)).toBe(INSERT_STATEMENT);
  expect(dst(`insert into x (a) values (select a from b);`)).toBe(
    INSERT_STATEMENT
  );
  // UPDATE
  expect(dst(`update a set b=1;`)).toBe(UPDATE_STATEMENT);
  expect(dst(`update a set b=(select b from a.id.b);`)).toBe(UPDATE_STATEMENT);
  // DELETE
  expect(dst(`delete from b`)).toBe(DELETE_STATEMENT);
  expect(dst(`delete from b where x =(select a from c)`)).toBe(
    DELETE_STATEMENT
  );
});

test("get wheres", done => {
  const query = `select * from users
        where age<=15
        and height not like "%tall"
        and isCool=false;`;
  queryParser.getWheres(query, wheres => {
    //otimizeWheres will reorder the results to make an equality statement first
    expect(wheres).toEqual([
      {
        comparator: "==",
        field: "isCool",
        value: false
      },
      {
        comparator: "!like",
        field: "height",
        value: "%tall"
      },
      {
        comparator: "<=",
        field: "age",
        value: 15
      }
    ]);
    done();
  });
});

test("get wheres - no equality check", done => {
  // optimize wheres detects when theres no equality check,
  // firebase will fetch entire collection
  const query = `select * from collection
    where age<=15
    and height not like "%tall";`;
  queryParser.getWheres(query, wheres => {
    expect(wheres).toEqual([
      {
        error: NO_EQUALITY_STATEMENTS
      },
      {
        comparator: "<=",
        field: "age",
        value: 15
      },
      {
        comparator: "!like",
        field: "height",
        value: "%tall"
      }
    ]);
    done();
  });
});

test("get sets", async () => {
  const query = `update users set height=10, name= "timmy"
        where age<5`;
  const sets = await queryParser.getSets(query);
  expect(sets).toEqual({ height: 10, name: "timmy" });
});

test("get order bys", () => {
  const query = `select * from lol
    where x < 15 and y=false
    order by age desc, name, y DESC`;
  const orderBys = queryParser.getOrderBys(query);
  expect(orderBys).toEqual([
    { propToSort: "age", ascending: false },
    { propToSort: "name", ascending: true },
    { propToSort: "y", ascending: false }
  ]);
});

test("get collection", () => {
  const { getCollection: getCol } = queryParser;
  // SELECT
  expect(getCol(`select * from lol;`, SELECT_STATEMENT)).toBe("lol");
  expect(getCol(`select * from lol/;`, SELECT_STATEMENT)).toBe("lol");
  expect(getCol(`select * from /lol/;`, SELECT_STATEMENT)).toBe("lol");
  expect(getCol(`select * from /lol;`, SELECT_STATEMENT)).toBe("lol");
  expect(
    getCol(`select * from c where age = (select a from q);`, SELECT_STATEMENT)
  ).toBe("c");
  // INSERT
  expect(getCol(`insert into / (a) values (1);`, INSERT_STATEMENT)).toBe("/");
  // UPDATE
  expect(getCol(`update b.d set age = 2;`, UPDATE_STATEMENT)).toBe("b/d");
  // DELETE
  expect(getCol(`delete from wow;`, SELECT_STATEMENT)).toBe("wow");
  expect(getCol(`delete from wow/;`, SELECT_STATEMENT)).toBe("wow");
  expect(getCol(`select * from /;`, SELECT_STATEMENT)).toBe("/");
  expect(getCol(`/`, SELECT_STATEMENT)).toBe("/");
  expect(getCol(`/;`, SELECT_STATEMENT)).toBe("/");
  expect(getCol(`.`, SELECT_STATEMENT)).toBe("/");
  expect(getCol(`.;`, SELECT_STATEMENT)).toBe("/");
});

test("get selected fields", () => {
  const { getSelectedFields } = queryParser;
  expect(getSelectedFields(`/`)).toBeNull();
  expect(getSelectedFields(`select * from lol;`)).toBeNull();
  expect(getSelectedFields(`select age from users`)).toEqual({ age: true });
  expect(getSelectedFields(`select a, q from users`)).toEqual({
    a: true,
    q: true
  });
});

test("get insert count", () => {
  const { getInsertCount } = queryParser;
  expect(getInsertCount("insert 65 into col (a) values (1);")).toEqual(65);
});

test("get not equal index", () => {
  const { getNotEqualIndex } = queryParser;
  let where = `where a !=5`;
  expect(getNotEqualIndex(where)).toEqual(where.indexOf("!="));
  where = ` where a<>5 `;
  expect(getNotEqualIndex(where)).toEqual(where.indexOf("<>"));
});

test("optimize wheres", () => {
  // function looks at wheres and determines which ones firebase
  // can filter by and moves that to index 0
  const { optimizeWheres } = queryParser;
  const a = {
    comparator: "<=",
    field: "a",
    value: 15
  };
  const b = {
    comparator: "==",
    field: "b",
    value: 1
  };
  // realtime db needs == where placed first
  expect(optimizeWheres([a, b], false)).toEqual([b, a]);
  // firestore is able to filter by <=, shouldn't be rearranged
  expect(optimizeWheres([a, b], true)).toEqual([a, b]);
  // no filterable wheres results in an error obj at index 0
  const err = { error: NO_EQUALITY_STATEMENTS };
  expect(optimizeWheres([a], false)).toEqual([err, a]);
});

test("check for cross db query", () => {
  // in case users want to query firestore when in realtime mode
  // and vice versa, ie: insert into firestore.users (select * from users);
  const { checkForCrossDbQuery: isCross } = queryParser;
  let { collection, isFirestore } = isCross(`users`);
  expect(collection).toBe(`users`);
  expect(isFirestore).toBeFalsy();

  let { collection: col2, isFirestore: fs2 } = isCross(`firestore/users`);
  expect(col2).toBe(`users`);
  expect(fs2).toBeTruthy();

  let { collection: col3, isFirestore: fs3 } = isCross(`db/users`);
  expect(col3).toBe(`users`);
  expect(fs3).toBeFalsy();

  configureFbsql({ isFirestore: true });
  let { collection: col4, isFirestore: fs4 } = isCross(`users`);
  expect(col4).toBe(`users`);
  expect(fs4).toBeTruthy();

  let { collection: col5, isFirestore: fs5 } = isCross(`db/users`);
  expect(col5).toBe(`users`);
  expect(fs5).toBeFalsy();
});
