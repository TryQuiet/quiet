export const areObjectsEqual = (obj1: any, obj2: any): boolean => {
  // Using this only makes sense for small objects whose properties are in the same order
  return JSON.stringify(obj1) === JSON.stringify(obj2)
}
