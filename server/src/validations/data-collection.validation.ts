import { z } from "zod";

const saveData = z.object({
  collectedData: z.array(
    z.object({
      timestamp: z.number(),
      latitude: z.number(),
      longitude: z.number(),
      accuracy: z.number(),
    })
  ),
  optimisationEnabled: z.boolean(),
  batteryLevel: z.number().nullable(),
  lightLevel: z.number().nullable(),
});

export type SaveData = z.infer<typeof saveData>;

export default {
  saveData,
};
