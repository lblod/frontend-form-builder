export async function queryAllItemsInStorePerPage(store, model) {
  const pageSize = 20;
  let allItemsGet = false;
  let currentPage = 0;
  const items = [];
  do {
    let results = [];
    try {
      results = await store.query(model, {
        page: { number: currentPage, size: pageSize },
      });
    } catch (error) {
      console.error(`Caught:`, error);
      allItemsGet = true;

      return items;
    }

    items.push(...results);

    if (results.length < pageSize) {
      allItemsGet = true;
    } else {
      currentPage++;
    }
  } while (!allItemsGet);

  return items;
}
