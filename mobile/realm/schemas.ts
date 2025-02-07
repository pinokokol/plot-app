export const PlotSchema = {
  name: 'Plot',
  properties: {
    id: 'string',
    plotGroupId: 'string',
    userId: 'string',
    data: 'string',
    synced: 'bool',
  },
  primaryKey: 'id',
};

export const PlotGroupSchema = {
  name: 'PlotGroup',
  properties: {
    id: 'string',
    userId: 'string',
    name: 'string',
    data: 'string',
    synced: 'bool',
  },
  primaryKey: 'id',
};
