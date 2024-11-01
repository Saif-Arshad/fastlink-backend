const logger = require("morgan");
const express = require("express");
const cors = require("cors");
const http = require("http");
require("dotenv").config();
const { connectToDatabase } = require("../config/database.js");
const routes = require("./routes");
const fileUpload = require('express-fileupload');

(async () => {
  connectToDatabase();
  
  const allowedOrigins = "*";
  const corsOptionsAll = {
    optionsSuccessStatus: 202,
    origin: allowedOrigins,
    credentials: true,
  };
  
  const app = express();
  const server = http.createServer(app);
  
  app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: '/tmp/'
  }));
  app.use(cors(corsOptionsAll));
  app.use(express.json({ limit: "10mb" }));
  app.use(logger("dev"));

  app.use(function (req, res, next) {
    res.success = async (data, meta) => {
      return res
        .status(200)
        .send({ success: true, error: null, body: data, meta });
    };

    res.error = async (error) => {
      return res.status(error.status || 500).send({
        success: false,
        error: error.message || "Internal Server Error",
        body: null,
        status: error.status || 500,
      });
    };

    next();
  });

  app.use("/api", routes);

  app.use((req, res) => {
    return res.status(404).send({ error: "Route not found" });
  });

  const port = process.env.PORT || 3344;
  server.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
})();
