const getOne = (query:any, data:any) => {
  let results:any[] = [].concat(data);

  const keys = Object.keys(query);

  for (let index = 0; index < keys.length; index += 1) {
    const key = keys[index];

    results = results.filter((datum:any) => datum[key] === query[key]);
  }

  return results[0];
};

export default getOne;
