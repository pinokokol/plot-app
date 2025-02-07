import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";

import routes from "./routes";
import databaseService from "./services/database.service";

const app = express();
const PORT = process.env.PORT || 8888;

const corsOptions = {
  origin: ["*"],
  credentials: true,
};

app.use(cors(corsOptions), express.json(), cookieParser());

app.use(morgan("dev"));

app.use("/api", routes);

app.get("/", (req, res) => {
  res.send("PLOT API is running!");
});

app.get("*", (req, res) => {
  res.status(404).send("404 Not Found");
});

async function startServer() {
  try {
    await databaseService.initialize();

    app.listen(PORT, () => {
      console.log(`Server is running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Error during Data Source initialization:", error);
    process.exit(1);
  }
}

startServer();
