import { clearDb, injectData } from "../test_resources/setup_db";
import executeSelect from "../select";
import { configureFbsql } from "../../index";

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

beforeAll(async () => {
  await clearDb();
  await injectData("users", users);
});

beforeEach(() => {
  configureFbsql({ shouldExpandResults: false });
});

test("callback working", done => {
  executeSelect("select * from users", data => {
    expect(users).toEqual(data);
    done();
  });
});

test("expanded results working", done => {
  configureFbsql({ shouldExpandResults: true });
  executeSelect("select * from users.def", results => {
    const { path, payload, firebaseListener } = results;
    expect(payload).toEqual(users.def);
    expect("users/def").toEqual(path);
    expect(typeof firebaseListener).toEqual("object");
    done();
  });
});

test("where queries working", done => {
  executeSelect("select * from users where age=25", results => {
    expect({ def: users.def }).toEqual(results);
    done();
  });
});

test("string regex", done => {
  executeSelect(`select * from users where email like %@c.com`, results => {
    expect({ abc: users.abc }).toEqual(results);
    done();
  });
});

test("less than operator", done => {
  executeSelect(`select * from users where age <25;`, results => {
    expect({ abc: users.abc }).toEqual(results);
    done();
  });
});

test("less than equal to operator", done => {
  executeSelect(`select * from users where age <=25;`, results => {
    expect(users).toEqual(results);
    done();
  });
});

test("greater than operator", done => {
  executeSelect(`select * from users where age >20;`, results => {
    expect({ def: users.def }).toEqual(results);
    done();
  });
});

test("greater than equal to operator", done => {
  executeSelect(`select * from users where age>=20;`, results => {
    expect(users).toEqual(results);
    done();
  });
});

test("query by null", done => {
  executeSelect(`select * from users where bio=null;`, results => {
    expect({ abc: users.abc }).toEqual(results);
    done();
  });
});

test("query by not null", done => {
  executeSelect(`select * from users where bio!=null;`, results => {
    expect({ def: users.def }).toEqual(results);
    done();
  });
});
