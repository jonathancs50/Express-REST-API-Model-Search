const dotenv = require("dotenv");
const mongoose = require("mongoose");
const Model = require("./models/modelModel");

process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION, shutting down....");
  console.log(err.name, err.message);
  process.exit(1);
});
//Setup our env variables
dotenv.config({ path: "./config.env" });
const app = require("./app");
const DB = process.env.DATABASE;
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then((connection) => {
    // console.log(connection.connection);
    console.log("DB connected succesfully!");
  });

//4) Start Server
const port = process.env.port || 3000;
const server = app.listen(port, () => {
  console.log("App is running on port 3000");
});

process.on("unhandledRejection", (err) => {
  console.log(err.name, err.message);
  console.log("Unhandled Rejection!!!, shutting down.....");
  server.close(() => {
    //Stop the server and let it finish all the requests in was handling
    process.exit(1); //Terminate the server
  });
});
