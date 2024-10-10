const {
  globalErrorHandler,
} = require("./controllers_OR_routehandlers/errorController");
const modelRouter = require("./routes/modelRoutes");
const userRouter = require("./routes/userRoutes");
const AppError = require("./utils/appError");
const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");

const app = express();

//1) Global Middleware
///SET SECURITY HTTP HEADERS
app.use(helmet());

//RATE LIMITER
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000, //will allow 100 requests per hour from a single IP
  message: "Too many requests from this IP, please try again in an hour",
});
//Add it to only apply to our API routes
app.use("/api", limiter);

//BODY PARSER, reading data from body int req.body
app.use(express.json({ limit: "10kb" }));

//Data sanitization against NoSQL query injection
app.use(mongoSanitize());
//Data sanitization against XSS
app.use(xss());

//Prevent Parameter Pollution
app.use(
  hpp({
    whitelist: ["age"],
  })
);

//DEVELOPEMENT LOGGING
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev")); //Specify the logging format
}
//serve static files like html
app.use(express.static(`${__dirname}/public`));

//Test middleware
app.use((req, res, next) => {
  // console.log(req.headers);
  next();
});

//create router so when a specific route is run it runs that middleware and executes certain route handlers (must go after the routes)
//Mount our routers
app.use("/api/v1/models", modelRouter);
app.use("/api/v1/users", userRouter);

app.all("*", (req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server`, 404));
});

//use the error controllers
app.use(globalErrorHandler);

module.exports = app;
