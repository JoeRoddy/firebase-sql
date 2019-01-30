import { clearDb } from "../../test_resources/setup_db";
import executeInsert from "../../insert";
import executeSelect from "../../select";
import { configureFbsql } from "../../..";

beforeEach(async () => {
  configureFbsql({ isFirestore: true });
  await clearDb(true);
});

afterAll(async () => {
  await clearDb(true);
});

test("standard insert", async () => {
  await executeInsert("insert into k (a) values ('b');");
  const res = await executeSelect("select * from k;");
  const val = res && res[Object.keys(res)[0]];
  expect(val).toEqual({ a: "b" });
});

test("callback based insert", done => {
  executeInsert("insert into g (i) values ('d');", res => {
    executeSelect(
      "select * from g;",
      res => {
        const val = res && res[Object.keys(res)[0]];
        expect(val).toEqual({ i: "d" });
        done();
      },
      false
    );
  });
});

test("insert based on select data", async () => {
  await executeInsert("insert into col (g) values ('h');");
  await executeInsert("insert into col2 select * from col;");
  const res = await executeSelect("select * from col2;");
  const val = res && res[Object.keys(res)[0]];
  expect(val).toEqual({ g: "h" });
});
