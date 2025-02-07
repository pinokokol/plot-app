import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class LocationMeasurement {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "bigint" })
  timestamp: number;

  @Column({ type: "double precision" })
  latitude: number;

  @Column({ type: "double precision" })
  longitude: number;

  @Column({ type: "double precision" })
  accuracy: number;

  @Column()
  optimisationEnabled: boolean;

  @Column({ type: "double precision", nullable: true })
  batteryLevel: number | null;

  @Column({ type: "double precision", nullable: true })
  lightLevel: number | null;
}
