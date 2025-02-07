export interface Plot {
  id: string;
  name: string;
  description: string;
  size: string;
  featureInfo: FeatureInfo;
}

export interface FeatureInfo {
  type: 'Feature';
  properties: any;
  id: string;
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
}

export interface PlotGroup {
  id: string;
  name: string;
  plots: Plot[];
}
