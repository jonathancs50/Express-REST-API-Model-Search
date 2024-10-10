const APIFeatures = require("../utils/apiFeatures");
const AppError = require("../utils/appError");
const catchAsyncFunction = require("../utils/catchAsyncFunction");

exports.deleteOne = (Model) =>
  catchAsyncFunction(async (req, res, next) => {
    const document = await Model.findByIdAndDelete(req.params.id);

    if (!document) {
      return next(new AppError("No document found with that ID", 404));
    }

    res.status(204).json({
      status: "success",
      data: null,
    });
  });

exports.updateOne = (Model) =>
  catchAsyncFunction(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return next(new AppError("No document found with that ID", 404));
    }
    res.status(200).json({
      status: "succes",
      data: {
        doc,
      },
    });
  });

exports.createOne = (Model) =>
  catchAsyncFunction(async (req, res, next) => {
    const newDoc = await Model.create(req.body);
    res.status(200).json({
      status: "success",
      data: newDoc,
    });
  });

exports.getOne = (Model, populateOption) =>
  catchAsyncFunction(async (req, res, next) => {
    let query = Model.findById(req.params.id); //returns a query
    //If there is a populate option we wil return a different query
    if (populateOption) {
      query = Model.findById(req.params.id).populate(populateOption);
    }
    const doc = await query;
    if (!doc) {
      return next(new AppError("No document found with that ID", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        data: doc,
      },
    });
  });

exports.getAll = (Model) =>
  catchAsyncFunction(async (req, res, next) => {
    //EXECUTE QUERY
    const features = new APIFeatures(Model.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const doc = await features.query;

    //SEND RESPONSE
    res.status(200).json({
      status: "success",
      results: doc.length,
      data: { data: doc },
    });
  });
