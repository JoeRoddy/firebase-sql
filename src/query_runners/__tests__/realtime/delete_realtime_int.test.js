import { clearDb, injectData } from "../../test_resources/setup_db";
import executeQuery from "../../../execute";

let testData;

beforeEach(async () => {
  await clearDb();
  testData = {
    collection1: {
      item1: {
        a: 1,
        b: false
      },
      item2: {
        a: 2,
        b: true
      }
    },
    collection2: "fake"
  };
  await injectData("/", testData);
});

afterAll(async () => {
  await clearDb();
});

test("delete entire collection", async () => {
  await executeQuery("delete from collection1");
  const { collection1, collection2 } = await executeQuery("select * from /;");
  expect(collection1).toBeUndefined();
  expect(collection2).toEqual(testData.collection2);
});

test("delete one child object", async () => {
  await executeQuery("delete from collection1.item1");
  const collection1 = await executeQuery("select * from collection1;");
  delete testData.collection1.item1;
  expect(collection1).toEqual(testData.collection1);
});

test("delete one prop", async () => {
  await executeQuery("delete from collection1.item1.a");
  const collection1 = await executeQuery("select * from collection1;");
  delete testData.collection1.item1.a;
  expect(collection1).toEqual(testData.collection1);
});

test("delete where condition", async () => {
  await executeQuery("delete from collection1 where b = true;");
  const collection1 = await executeQuery("select * from collection1;");
  delete testData.collection1.item2;
  expect(collection1).toEqual(testData.collection1);
});
