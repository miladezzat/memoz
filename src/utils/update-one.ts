const updateOne = (query:any, data:any, newData:any) => {
  let updated = {};
  const updatedData = data.map((datum:any) => {
    if (datum.id === query.id) {
      updated = {
        ...datum,
        ...newData,
      };
      return updated;
    }

    return datum;
  });
  return { updated, updatedData };
};

export default updateOne;
