import { z } from "zod";

const addPlotGroup = z.object({
  name: z.string().min(1),
  id: z.string().uuid().optional(),
});

const addPlot = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  size: z.number().min(0, "Size must be a positive number"),
  coordinates: z
    .array(
      z.object({
        latitude: z.number(),
        longitude: z.number(),
      })
    )
    .min(4, "At least one coordinate is required"),
  plotGroupId: z.union([z.string().uuid(), z.number().int()]).optional(),
});

const deletePlot = z.object({
  id: z.string().uuid(),
});

const sync = z.object({
  plotGroups: z.array(addPlotGroup),
  plots: z.array(addPlot),
});

export default {
  addPlotGroup,
  addPlot,
  deletePlot,
  sync,
};
