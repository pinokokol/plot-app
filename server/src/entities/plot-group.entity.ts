import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Plot } from "./plot.entity";
import { User } from "./user.entity";

@Entity()
export class PlotGroup {
  @PrimaryGeneratedColumn("increment")
  id: number;

  @Column()
  name: string;

  @OneToMany(() => Plot, (plot) => plot.plotGroup, {
    cascade: true,
    eager: true,
  })
  plots: Plot[];

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: "userId" })
  user: User;
}
