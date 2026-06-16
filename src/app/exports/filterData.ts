export function filterData(data: any[], options: any) {
  if (!options.selectedFields || options.selectedFields.length === 0) {
    return data;
  }
  return data.map(item => {
    const filtered: any = {};
    options.selectedFields.forEach((field: string) => {
      if (field.includes('.')) {
        const parts = field.split('.');
        let current = item;
        let found = true;
        for (const part of parts) {
          if (current && typeof current === 'object' && part in current) {
            current = current[part];
          } else {
            found = false;
            break;
          }
        }
        if (found) filtered[field] = current;
      } else {
        filtered[field] = item[field];
      }
    });
    return filtered;
  });
}