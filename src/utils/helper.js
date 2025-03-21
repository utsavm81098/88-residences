export const flattenUnitData = (unitDataArray) => {
  const flattened = {};
  unitDataArray.forEach((floor) => {
    floor.units.forEach((unit) => {
      if (unit.name) {
        flattened[unit.name] = unit;
      }
    });
  });
  return flattened;
};
