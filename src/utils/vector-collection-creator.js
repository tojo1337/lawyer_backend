import { vectorDb } from "../db/vector-db.connector.js";
import { vectorCollections } from "../enum/vector-collections.js";

export async function vectorCollectionCreator() {
  const collectionList = Object.values(vectorCollections);
  try {
    const existingcollections = await vectorDb.listIndexes();
    const asyncOpsArr = collectionList.reduce((acc, item) => {
      if (!existingcollections.includes(item)) {
        acc.push(() =>
          vectorDb.createIndex({
            indexName: item,
            dimension: 3072,
            metric: "cosine",
          }),
        );
      }
      return acc;
    }, new Array());
    for (const item of asyncOpsArr) {
      await item();
    }
  } catch (err) {
    throw err;
  }
}
