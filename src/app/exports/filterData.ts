export function filterData(data: any[], options: any) {
  if (!options.selectedFields || options.selectedFields.length === 0) {
    return data;
  }
  return data.map(item => {
    const filtered: any = {};
    options.selectedFields.forEach((field: string) => {
      filtered[field] = item[field];
    });
    return filtered;
  });
}