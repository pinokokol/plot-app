import { SaveData } from "@/validations/data-collection.validation";
import databaseService from "./database.service";
import { LocationMeasurement } from "@/entities/location-measurement.entity";

const saveData = async (data: SaveData) => {
  const locationRepository = databaseService.database().getRepository(LocationMeasurement);

  const measurements = data.collectedData.map((measurement) => {
    const locationMeasurement = new LocationMeasurement();
    locationMeasurement.timestamp = measurement.timestamp;
    locationMeasurement.latitude = measurement.latitude;
    locationMeasurement.longitude = measurement.longitude;
    locationMeasurement.accuracy = measurement.accuracy;
    locationMeasurement.optimisationEnabled = data.optimisationEnabled;
    locationMeasurement.batteryLevel = data.batteryLevel;
    locationMeasurement.lightLevel = data.lightLevel;
    return locationMeasurement;
  });

  await locationRepository.save(measurements);
};

export default {
  saveData,
};
