const User = require("../models/userModel");
const AppError = require("../utils/appError");
const catchAsyncFunction = require("../utils/catchAsyncFunction");
const factory = require("../controllers_OR_routehandlers/handlerFactory");

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((field) => {
    if (allowedFields.includes(field)) {
      newObj[field] = obj[field];
    }
  });
  return newObj;
};

//Route Handlers
exports.getAllUsers = catchAsyncFunction(async (req, res, next) => {
  //EXECUTE QUERY
  const users = await User.find();

  //SEND RESPONSE
  res.status(200).json({
    status: "success",
    results: users.length,
    data: { users },
  });
});
exports.createUser = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "Route not defined, please use signup",
  });
};

exports.updateMe = catchAsyncFunction(async (req, res, next) => {
  //1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        "This route is not for password updates. Please use /updateMyPassword",
        400
      )
    );
  }

  //3) Filter the body so user cannot update other filds like roles
  const filteredBody = filterObj(req.body, "name", "email");
  //3) Update the user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsyncFunction(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: "success",
    data: null,
  });
});
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.getUser = factory.getOne(User);

//Must not update passwords with this update function
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
