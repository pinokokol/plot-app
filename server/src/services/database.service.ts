import { User } from "@/entities/user.entity";
import passwordUtil from "@/utils/password.util";
import * as path from "path";

import { DataSource } from "typeorm";

let databaseInstance: DataSource | null = null;

async function initialize(): Promise<void> {
  const entitiesPath = path.join(__dirname, "..", "entities", "*.ts");

  if (!databaseInstance) {
    databaseInstance = new DataSource({
      type: "postgres",
      host: "127.0.0.1",
      port: 5493,
      username: "postgres",
      password: "postgrespw",
      database: "postgres",
      entities: [entitiesPath],
      logging: false,
      synchronize: true,
    });

    await databaseInstance.initialize();

    try {
      const user = await databaseInstance.getRepository(User).findOne({
        where: { email: "pino@app.com" },
      });

      if (!user) {
        await databaseInstance.getRepository(User).save({
          email: "pino@app.com",
          password: await passwordUtil.hash("Pino9999"),
          name: "Pino",
          surname: "App",
        });

        console.log("Database initialized with owner");
      } else {
        console.log("Database initialized");
      }
    } catch (error) {
      console.error(error);
    }
  }
}

export function database(): DataSource {
  if (!databaseInstance) {
    throw new Error("Database not initialized");
  }
  return databaseInstance;
}

export default {
  initialize,
  database,
};
