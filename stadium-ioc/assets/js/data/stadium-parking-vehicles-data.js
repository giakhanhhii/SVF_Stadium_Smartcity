const parkingLotConfig = [
  { id: 'P1', angle: (5 * Math.PI) / 4, capacity: 400, usagePct: 48, motorbikeRatio: 0.54, seed: 11 },
  { id: 'P2', angle: (7 * Math.PI) / 4, capacity: 428, usagePct: 62, motorbikeRatio: 0.58, seed: 23 },
  { id: 'P3', angle: (3 * Math.PI) / 4, capacity: 380, usagePct: 45, motorbikeRatio: 0.56, seed: 37 },
  { id: 'P4', angle: Math.PI / 4, capacity: 472, usagePct: 55, motorbikeRatio: 0.6, seed: 41 },
];

export const parkingVehicleLots = parkingLotConfig.map((lot) => {
  const total = Math.round((lot.capacity * lot.usagePct) / 100);
  const motorbikes = Math.round(total * lot.motorbikeRatio);
  return {
    ...lot,
    cars: total - motorbikes,
    motorbikes,
    total,
  };
});

const cars = parkingVehicleLots.reduce((sum, lot) => sum + lot.cars, 0);
const motorbikes = parkingVehicleLots.reduce((sum, lot) => sum + lot.motorbikes, 0);
const total = cars + motorbikes;
const capacity = parkingVehicleLots.reduce((sum, lot) => sum + lot.capacity, 0);

export const parkingVehicleSummary = {
  cars,
  motorbikes,
  total,
  capacity,
  usagePct: Math.round((total / capacity) * 100),
};
