import fbsql, { configureFbsql, getConfig } from "../";

test("imports working", () => {
  expect(typeof fbsql).toBe("function");
  expect(typeof configureFbsql).toBe("function");
  expect(typeof getConfig()).toBe("object");
});

test("configure working", () => {
  configureFbsql({ isAdmin: true, isFirestore: true });
  const { isAdmin, isFirestore, database, shouldExpandResults } = getConfig();
  expect(isAdmin).toBeTruthy();
  expect(isFirestore).toBeTruthy();
  expect(database).toBeNull();
  expect(shouldExpandResults).toBeFalsy();
});
