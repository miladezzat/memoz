const deleteData = (query:any, data:any) => {
  let results = data;

  const keys = Object.keys(query);

  for (let index = 0; index < keys.length; index += 1) {
    const key = keys[index];

    results = results.filter((datum:any) => datum[key] !== query[key]);
  }

  return results;
};

export default deleteData;
