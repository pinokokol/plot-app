import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { PlotGroup } from "./plot-group.entity";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ default: "", select: false })
  password: string;

  @Column({ default: "" })
  name: string;

  @Column({ default: "" })
  surname: string;

  @OneToMany(() => PlotGroup, (plotGroup) => plotGroup.user)
  plotGroups: PlotGroup[];
}
