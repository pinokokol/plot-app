import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { PlotGroup } from "./plot-group.entity";

@Entity()
export class Plot {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column("float")
  size: number;

  @Column("jsonb")
  coordinates: {
    latitude: number;
    longitude: number;
  }[];

  @ManyToOne(() => PlotGroup, (plotGroup) => plotGroup.plots)
  plotGroup: PlotGroup;
}
