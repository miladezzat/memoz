const update = (query:any = {}, data:any = {}, newData: any = {}) => {
  let results = [...data];

  const keys = Object.keys(query);

  for (let index = 0; index < keys.length; index += 1) {
    const key = keys[index];

    results = results.map((datum:any) => {
      if (datum[key] === query[key]) {
        return newData[key];
      }

      return datum[key];
    });
  }

  return results;
};

export default update;
