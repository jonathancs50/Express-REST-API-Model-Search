const User = require("../models/userModel");
const catchAsyncFunction = require("../utils/catchAsyncFunction");
const jwt = require("jsonwebtoken");
const AppError = require("../utils/appError");
const Email = require("../utils/email");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { promisify } = require("util");

//Function to create a JWT Token
const createToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

//create the login token
const createSendToken = (user, statusCode, res) => {
  const token = createToken(user._id);

  const cookieOptions = {
    expires: new Date(Date.now() + parseInt(process.env.JWT_COOKIE_EXPIRES_IN)),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;
  res.cookie("jwt", token, cookieOptions);

  user.password = undefined; //Remove the password from the output

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user: user,
    },
  });
};

exports.signup = catchAsyncFunction(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });
  const url = `${req.protocol}://${req.get("host")}/api/v1/users/me`;
  await new Email(newUser, url).sendWelcome();

  createSendToken(newUser, 201, res);
});
exports.login = catchAsyncFunction(async (req, res, next) => {
  const { email, password } = req.body;
  //1) Check if email and password exist
  if (!email && !password) {
    return next(new AppError("Please provide an email and password", 400));
  }
  //2)Check if user exists and password is correct
  const user = await User.findOne({ email }).select("+password");
  //await user.correctPassword(password, user.password); We call our instance password: correctPassword(candidatePassword,userPassword)
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect email or password", 401)); //We keep the error message vague so attackers do not know if the username/password is wrong
  }
  //3)If everything is ok, send token to client
  createSendToken(user, 200, res);
});

exports.protect = catchAsyncFunction(async (req, res, next) => {
  //1)Get the token and check if its there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    //The token with be in the header.authrization: {authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2ZTgyNWExMjExMmE5M2JkNGVjZDEzZiIsImlhdCI6MTcyNjU1NTM4NCwiZXhwIjoxNzI2NTU4OTg0fQ.Cttkx-c90noiEq4u-I3pF3WG9PGceqHYdt67vyw0Tq0'},
    token = req.headers.authorization.split(" ")[1]; //token='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2ZTgyNWExMjExMmE5M2JkNGVjZDEzZiIsImlhdCI6MTcyNjU1NTM4NCwiZXhwIjoxNzI2NTU4OTg0fQ.Cttkx-c90noiEq4u-I3pF3WG9PGceqHYdt67vyw0Tq0'
  }
  //call an error if theres no token
  if (!token) {
    return next(new AppError("You are not logged in!,please login", 401));
  }

  //2)Verfication of token
  //decoded payload= { id: '66e825a12112a93bd4ecd13f', iat: 1726555078, exp: 1726558678 }
  const decodedPayload = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET
  );

  //3)Check if user still exists (to show an error if the JWT token was created but then the user was deleted)
  const currentUser = await User.findById(decodedPayload.id);
  if (!currentUser) {
    return next(
      new AppError("The user belonging to the token does not exist", 401)
    );
  }
  //4)Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decodedPayload.iat)) {
    return new AppError(
      "User recently changed password! Please login again",
      401
    );
  }
  //Pass all the checks then granted access to protected route
  req.user = currentUser; //This allows us to also place the role parameter on the req.user so we can use it in the restrictTO() middleware function
  next();
});

exports.validateJWT = catchAsyncFunction(async (req, res, next) => {
  res.status(200).json({
    valid: true,
    message: "Token is valid",
    userId: req.userId, // Assuming the token payload includes a user ID
  });
});
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles=['admin']
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsyncFunction(async (req, res, next) => {
  //1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError("There is no user with that email address", 404));
  }
  //2) Generate the reandom reset token with instance method
  const resetToken = user.createPasswordResetToken();

  await user.save({ validateBeforeSave: false });
  //3) Send it to user's email
  const resetURL = `${req.protocol}://${req.get("host")}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Please submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\n If you did not forget your password please ignore this email`;
  try {
    await new Email(user, resetURL).sendPasswordReset();

    if (process.env.NODE_ENV === "development") {
      res.status(200).json({
        status: "success",
        message: `Reset URL: ${resetURL}`,
      });
    } else {
      res.status(200).json({
        status: "success",
        message: "Email reset token sent!",
      });
    }
  } catch (error) {
    user.createPasswordResetToken = undefined;
    user.createPasswordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError("There was an error sending your reset token", 500)
    );
  }
});

exports.resetPassword = catchAsyncFunction(async (req, res, next) => {
  //1) Get user based on the token
  //encrpt the token and compare it to the encrpted one stored on the user
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  //Find the user in the DB based off the token, compare the token expiration date to the current date to see if it has not expired
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gte: Date.now() },
  });

  console.log(user);
  //2) If token has not expired, and there is a user,set the new password
  //Throw error if there is invalid token
  if (!user) {
    return next(new AppError("Token is invalid or has expired", 400));
  }
  //Update the password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  //Clear the token data on the user
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  //save the user
  await user.save();
  //3) Update changedPasswordAt property for the user
  //4) Log the user in, send the JWT
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsyncFunction(async (req, res, next) => {
  //1) Get the user from the collection
  const user = await User.findById(req.user.id).select("+password");
  //2) Check if POSTed current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError("Your current password is wrong ", 401));
  }
  //3) If so update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  //4) Log user in, send JWT
  createSendToken(user, 200, res);
});
