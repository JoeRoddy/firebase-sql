import { clearDb, injectData } from "../../test_resources/setup_db";
import executeSelect from "../../select";
import { configureFbsql } from "../../../index";

const users = {
  abc: {
    email: "ab@c.com",
    age: 20,
    isOnline: false
  },
  def: {
    email: "de@ef.gov",
    age: 25,
    isOnline: true,
    bio: "what a guy"
  }
};

beforeEach(async () => {
  configureFbsql({ shouldExpandResults: false, isFirestore: false });
  await clearDb();
  await injectData("users", users);
});

afterAll(async () => {
  await clearDb();
});

// important: must make sure callback queries are not listeners,
// otherwise they'll refire when other tests alter the database.
// can pass false after callback arg to prevent a listener

test("callback working", done => {
  configureFbsql({ shouldExpandResults: true });
  executeSelect(
    "select * from users",
    ({ payload, firebaseListener }) => {
      expect(payload).toEqual(users);
      done();
    },
    false
  );
});

test("async working", async () => {
  const data = await executeSelect("select * from users");
  expect(users).toEqual(data);
});

test("select specific property", async () => {
  const data = await executeSelect("select * from users.abc.age");
  expect(users.abc.age).toEqual(data);
});

test("select certain fields", async () => {
  const data = await executeSelect("select email, age from users");
  Object.keys(data).forEach(id => {
    const user = data[id];
    expect(user.age).toBeTruthy();
    expect(user.email).toBeTruthy();
    expect(user.isOnline).toBeUndefined();
    expect(user.bio).toBeUndefined();
  });
});

test("expanded results working", done => {
  configureFbsql({ shouldExpandResults: true });
  executeSelect("select * from users.def", results => {
    const { path, payload, firebaseListener } = results;
    expect(payload).toEqual(users.def);
    expect("users/def").toEqual(path);
    expect(typeof firebaseListener).toEqual("object");
    expect(typeof firebaseListener.unsubscribe).toEqual("function");
    firebaseListener.unsubscribe();
    configureFbsql({ shouldExpandResults: false });
    done();
  });
});

test("where queries working", async () => {
  const results = await executeSelect("select * from users where age=25");
  expect({ def: users.def }).toEqual(results);
});

test("string regex", async () => {
  const results = await executeSelect(
    `select * from users where email like %@c.com`
  );
  expect({ abc: users.abc }).toEqual(results);
});

test("less than operator", async () => {
  const results = await executeSelect(`select * from users where age <25;`);
  expect({ abc: users.abc }).toEqual(results);
});

test("less than equal to operator", async () => {
  const results = await executeSelect(`select * from users where age <=25;`);
  expect(users).toEqual(results);
});

test("greater than operator", async () => {
  const results = await executeSelect(`select * from users where age >20;`);
  expect({ def: users.def }).toEqual(results);
});

test("greater than equal to operator", async () => {
  const results = await executeSelect(`select * from users where age>=20;`);
  expect(users).toEqual(results);
});

test("query by null", async () => {
  const results = await executeSelect(`select * from users where bio=null;`);
  expect({ abc: users.abc }).toEqual(results);
});

test("query by not null", async () => {
  const results = await executeSelect(`select * from users where bio!=null;`);
  expect({ def: users.def }).toEqual(results);
});
