import { clearDb, injectData } from "../../test_resources/setup_db";
import executeQuery from "../../../execute";
import { configureFbsql } from "../../..";

let localBlogs = {};

beforeEach(async () => {
  configureFbsql({ isFirestore: true });
  await clearDb(true);
  localBlogs = {
    blog1: {
      title: "My first blog",
      description: "blog descrip"
    },
    blog2: {
      title: "My second blog",
      description: "wowza"
    }
  };
  await injectData("/blogs", localBlogs, true);
});

afterAll(async () => {
  await clearDb(true);
  configureFbsql({ isFirestore: false });
});

test("firestore: update all", async () => {
  await executeQuery("update blogs set tall = true;");
  const blogsRes = await executeQuery("select * from blogs;");
  updateLocalBlogs({ tall: true });
  expect(blogsRes).toEqual(localBlogs);
});

test("firestore: select based update", async () => {
  await executeQuery(
    "update blogs set title = (select title from blogs.blog1);"
  );
  const blogsRes = await executeQuery("select * from blogs;");
  localBlogs.blog2.title = localBlogs.blog1.title;
  expect(blogsRes).toEqual(localBlogs);
});

test("firestore: filtered update", async () => {
  await executeQuery("update blogs set length=15 where description = 'wowza';");
  const blogsRes = await executeQuery("select * from blogs;");
  localBlogs.blog2.length = 15;
  expect(blogsRes).toEqual(localBlogs);
});

const updateLocalBlogs = (updates = {}) => {
  Object.keys(localBlogs).forEach(blogId => {
    Object.keys(updates).forEach(key => {
      localBlogs[blogId][key] = updates[key];
    });
  });
};
