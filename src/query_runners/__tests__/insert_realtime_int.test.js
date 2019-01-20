import { clearDb, injectData } from "../test_resources/setup_db";
import executeInsert from "../insert";
import executeSelect from "../select";

beforeEach(async () => {
  await clearDb();
});

afterAll(async () => {
  await clearDb();
});

test("standard insert", async () => {
  await executeInsert("insert into users (a) values ('b');");
  const users = await executeSelect("select * from users;");
  const val = users && users[Object.keys(users)[0]];
  expect(val).toEqual({ a: "b" });
});

test("callback based insert", done => {
  executeInsert("insert into users (c) values ('d');", res => {
    executeSelect(
      "select * from users;",
      users => {
        const val = users && users[Object.keys(users)[0]];
        expect(val).toEqual({ c: "d" });
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
