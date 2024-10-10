const { models } = require("mongoose");
const Model = require("../models/modelModel");
const factory = require("./handlerFactory");
const catchAsyncFunction = require("../utils/catchAsyncFunction");

//ROUTE HANDLERS

exports.aliasTopYoung = async (req, res, next) => {
  req.query.limit = "5";
  req.query.sort = "age";
  //Specify specific fields
  req.query.fields = "name age"; //NOT WORKING
  next();
};

exports.getAllModels = factory.getAll(Model);
// exports.getAllModels = catchAsyncFunction(async (req, res, next) => {
//   //EXECUTE QUERY
//   const features = new APIFeatures(Model.find(), req.query)
//     .filter()
//     .sort()
//     .limitFields()
//     .paginate();

//   const models = await features.query;

//   //SEND RESPONSE
//   res.status(200).json({
//     status: "success",
//     results: models.length,
//     data: { models },
//   });
// });

exports.createModel = factory.createOne(Model);
// exports.createModel = catchAsyncFunction(async (req, res, next) => {
//   const newModel = await Model.create(req.body);
//   res.status(200).json({
//     status: "success",
//     data: { model: newModel },
//   });
// });

exports.getModel = factory.getOne(Model);
// exports.getModel = catchAsyncFunction(async (req, res, next) => {
//   const model = await Model.findById(req.params.modelID); //returns a query

//   if (!model) {
//     return next(new AppError("No model found with that ID", 404));
//   }

//   res.status(200).json({
//     status: "success",
//     data: {
//       model,
//     },
//   });
// });
exports.updateModel = factory.updateOne(Model);
// exports.updateModel = catchAsyncFunction(async (req, res, next) => {
//   const model = await Model.findByIdAndUpdate(req.params.modelID, req.body, {
//     new: true,
//     runValidators: true,
//   });

//   if (!model) {
//     return next(new AppError("No model found with that ID", 404));
//   }
//   res.status(200).json({
//     status: "succes",
//     data: {
//       model,
//     },
//   });
// });
exports.deleteModel = factory.deleteOne(Model);
// exports.deleteModel = catchAsyncFunction(async (req, res, next) => {
//   const model = await Model.findByIdAndDelete(req.params.modelID);

//   if (!model) {
//     return next(new AppError("No model found with that ID", 404));
//   }

//   res.status(204).json({
//     status: "success",
//     data: null,
//   });
// });

exports.getModelStats = catchAsyncFunction(async (req, res, next) => {
  // Define the aggregation pipeline
  const stats = await Model.aggregate([
    {
      // Correct $match stage with $gte operator
      $match: { age: { $gte: 25 } },
    },
    {
      // Group the models by ethnicity and calculate statistics
      $group: {
        _id: "$ethnicity", // Groups by ethnicity field
        averageAge: { $avg: "$age" }, // Calculates average age for each group
        totalModels: { $sum: 1 }, // Counts the number of models in each group
        minAge: { $min: "$age" }, // Finds the minimum age
        maxAge: { $max: "$age" }, // Finds the maximum age
      },
    },
    {
      // Sort stage to sort by averageAge in descending order (-1)
      $sort: { averageAge: -1 }, // -1 for descending, 1 for ascending
    },
  ]);

  res.status(200).json({
    status: "success",
    data: {
      stats, // The aggregated stats for each ethnicity
    },
  });
});

exports.getSkills = catchAsyncFunction(async (req, res, next) => {
  const age = req.params.age * 1;

  const skills = await Model.aggregate([
    {
      // Correct $match stage with $gte operator
      $match: { age: age },
    },
    {
      // Unwind the skills array to create a new document for each skill
      $unwind: "$skills",
    },
    {
      // Project only the fields you want to include in the output
      $project: {
        _id: 0, // Exclude the _id field
        name: 1, // Include the name field
        age: 1, // Include the age field
        skill: "$skills", // Include the skill (unwinded value from skills array)
      },
    },
  ]);
  res.status(200).json({
    status: "success",
    data: {
      skills, // The aggregated stats for each ethnicity
    },
  });
});
