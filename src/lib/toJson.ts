export const toJson = (obj: any, prettyPrint = false) =>
  prettyPrint ? JSON.stringify(obj, null, 2) : JSON.stringify(obj);
