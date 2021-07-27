const deleteOne = (query:any, data:any) => data.filter((datum:any) => datum[query.id] !== query.id);

export default deleteOne;
