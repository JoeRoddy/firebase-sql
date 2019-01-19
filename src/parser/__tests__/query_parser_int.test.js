// int tests where it executes against firebase:
// getWheres() :  select * from users where age = (select age from user.xyz);
// getObjectsFromInsert() : insert into x selct * from y

test("fake", () => {
  expect(true).toBeTruthy();
});
