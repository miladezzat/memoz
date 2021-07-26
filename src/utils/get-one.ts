const convertQuery = (query:any, data:any) => {
  let results = [...data];
  // console.log({ results });

  const keys = Object.keys(query);

  for (let index = 0; index < keys.length; index += 1) {
    const key = keys[index];

    results = results.filter((datum:any) => datum[key] === query[key]);
  }

  return results[0];
};

export default convertQuery;
