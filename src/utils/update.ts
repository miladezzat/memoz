const update = (query:any = {}, data:any = {}, newData: any = {}) => {
  let results:any[] = [].concat(data);

  const keys = Object.keys(query);

  for (let index = 0; index < keys.length; index += 1) {
    const key = keys[index];

    results = results.map((datum:any) => {
      if (datum[key] === query[key]) {
        return {
          ...datum,
          ...newData,
        };
      }

      return datum[key];
    });
  }

  return results;
};

export default update;
