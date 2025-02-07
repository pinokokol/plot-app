import { PlotGroup } from "@/entities/plot-group.entity";
import databaseService from "./database.service";
import { User } from "@/entities/user.entity";
import { ILike } from "typeorm";
import { Plot } from "@/entities/plot.entity";

interface PlotGroupQueryParams {
  limit: number | undefined;
  offset: number;
  sort: string;
  order: string;
  query: string;
}

interface AddPlotBody {
  id: string;
  name: string;
  description?: string;
  size: number;
  coordinates: {
    latitude: number;
    longitude: number;
  }[];
}

interface PlotGroupSync {
  name: string;
  id?: string | undefined;
}

interface PlotSync {
  id: string;
  name: string;
  size: number;
  coordinates: {
    latitude: number;
    longitude: number;
  }[];
  description?: string | undefined;
  plotGroupId?: string | number | undefined;
}

interface PlotGroupIds {
  oldId: string;
  newId: number;
}

const getPlotGroups = async (user: User, params: PlotGroupQueryParams) => {
  const { limit, offset, sort, order, query } = params;

  const findOptions: any = {
    where: {
      user,
      name: query ? ILike(`%${query}%`) : undefined,
    },
    order: {
      [sort]: order.toUpperCase(),
    },
    skip: offset,
  };

  if (limit !== undefined) {
    findOptions.take = limit;
  }

  return await databaseService
    .database()
    .getRepository(PlotGroup)
    .find(findOptions);
};

const addPlotGroup = async (user: User, name: string) => {
  const plotGroup = new PlotGroup();
  plotGroup.name = name;
  plotGroup.user = user;

  return await databaseService
    .database()
    .getRepository(PlotGroup)
    .save(plotGroup);
};

const deletePlotGroup = async (plotGroupId: number) => {
  await databaseService
    .database()
    .transaction(async (transactionalEntityManager) => {
      const plotGroup = await transactionalEntityManager
        .getRepository(PlotGroup)
        .findOne({ where: { id: plotGroupId } });

      if (!plotGroup) {
        throw new Error("Plot group not found");
      }

      await transactionalEntityManager.getRepository(Plot).delete({
        plotGroup: { id: plotGroupId },
      });

      await transactionalEntityManager
        .getRepository(PlotGroup)
        .delete(plotGroupId);
    });
};

const addPlot = async (plot: AddPlotBody, plotGroupId: number) => {
  const plotGroup = await databaseService
    .database()
    .getRepository(PlotGroup)
    .findOne({ where: { id: plotGroupId } });

  if (!plotGroup) {
    throw new Error("Plot group not found");
  }

  const newPlot = new Plot();
  newPlot.id = plot.id;
  newPlot.name = plot.name;
  newPlot.description = plot.description ?? "";
  newPlot.size = plot.size;
  newPlot.coordinates = plot.coordinates;
  newPlot.plotGroup = plotGroup;

  return await databaseService.database().getRepository(Plot).save(newPlot);
};

const deletePlot = async (plotGroupId: number, id: string) => {
  await databaseService
    .database()
    .getRepository(Plot)
    .delete({ plotGroup: { id: plotGroupId }, id });
};

const sync = async (
  user: User,
  plotGroups: PlotGroupSync[],
  plots: PlotSync[]
): Promise<PlotGroupIds[]> => {
  const plotGroupsWithPlots = plotGroups.map((plotGroup) => {
    const plotsForGroup = plots.filter(
      (plot) => plot.plotGroupId === plotGroup.id
    );

    return {
      ...plotGroup,
      plots: plotsForGroup,
    };
  });

  const remainingPlotGroups = plotGroups.filter((plotGroup) =>
    Number.isInteger(plotGroup.id)
  );

  const remainingPlots = plots.filter((plot) =>
    Number.isInteger(plot.plotGroupId)
  );

  const plotGroupIds: PlotGroupIds[] = [];

  await databaseService
    .database()
    .transaction(async (transactionalEntityManager) => {
      for (const plotGroup of plotGroupsWithPlots) {
        const newPlotGroup = new PlotGroup();
        newPlotGroup.name = plotGroup.name;
        newPlotGroup.user = user;

        const savedPlotGroup = await transactionalEntityManager
          .getRepository(PlotGroup)
          .save(newPlotGroup);

        plotGroupIds.push({
          oldId: plotGroup.id ?? "",
          newId: savedPlotGroup.id,
        });

        for (const plot of plotGroup.plots) {
          const newPlot = new Plot();
          newPlot.id = plot.id;
          newPlot.name = plot.name;
          newPlot.description = plot.description ?? "";
          newPlot.size = plot.size;
          newPlot.coordinates = plot.coordinates;
          newPlot.plotGroup = savedPlotGroup;

          await transactionalEntityManager.getRepository(Plot).save(newPlot);
        }
      }

      for (const plotGroup of remainingPlotGroups) {
        const newPlotGroup = new PlotGroup();
        newPlotGroup.name = plotGroup.name;
        newPlotGroup.user = user;

        const savedPlotGroup = await transactionalEntityManager
          .getRepository(PlotGroup)
          .save(newPlotGroup);

        plotGroupIds.push({
          oldId: plotGroup.id ?? "",
          newId: savedPlotGroup.id,
        });
      }

      for (const plot of remainingPlots) {
        if (!Number.isInteger(plot.plotGroupId)) {
          throw new Error("Plot group id must be an integer");
        }

        const plotGroup = await transactionalEntityManager
          .getRepository(PlotGroup)
          .findOne({ where: { id: plot.plotGroupId as number } });

        if (!plotGroup) {
          throw new Error("Plot group not found");
        }

        const newPlot = new Plot();
        newPlot.id = plot.id;
        newPlot.name = plot.name;
        newPlot.description = plot.description ?? "";
        newPlot.size = plot.size;
        newPlot.coordinates = plot.coordinates;
        newPlot.plotGroup = plotGroup;

        await transactionalEntityManager.getRepository(Plot).save(newPlot);
      }
    });

  return plotGroupIds;
};

export default {
  getPlotGroups,
  addPlotGroup,
  deletePlotGroup,
  addPlot,
  deletePlot,
  sync,
};
