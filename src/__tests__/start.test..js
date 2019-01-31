import fbsql, { configureFbsql, getConfig } from "../";

test("imports working", () => {
  expect(typeof fbsql).toBe("function");
  expect(typeof configureFbsql).toBe("function");
  expect(typeof getConfig()).toBe("object");
});

test("configure working", () => {
  configureFbsql({
    isFirestore: true,
    shouldCommitResults: true,
    shouldExpandResults: false
  });
  const { isFirestore, shouldCommitResults, shouldExpandResults } = getConfig();
  expect(isFirestore).toBeTruthy();
  expect(shouldCommitResults).toBeTruthy();
  expect(shouldExpandResults).toBeFalsy();
});
