const mongoose = require("mongoose");
const crypto = require("crypto");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: {
    type: String,
    required: [true, "Please enter your name"],
  },
  email: {
    type: String,
    required: [true, "Please enter your email"],
    unique: true,
    lowercase: true,
    //Custom validator for emails
    validate: [validator.isEmail, "Please provide a valid email"],
  },
  role: {
    type: String,
    enum: ["user", "model", "admin"],
    default: "user",
  },
  photo: {
    type: String,
  },
  password: {
    type: String,
    required: [true, "Please enter your password"],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, "Please confirm your password"],
    validate: {
      //ONLY WORKS ON .CREATE and .SAVE !!!
      validator: function (pw) {
        return pw === this.password; //password 1234=pwconfirm 1234  then will return true else false and casue validate error
      },
      message: "Passwords are not the same",
    },
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

//Password encryption
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next(); //If password is not changed skip function

  this.password = await bcrypt.hash(this.password, 12); //Hash the password with cost of 12
  this.passwordConfirm = undefined; //Delete password confirmed field
  next();
});

userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1111;
  next();
});

//Add query to not show users that have deactivated accounts
userSchema.pre(/^find/, function (next) {
  //This points to the current query
  this.find({ active: { $ne: false } });
  next();
});

//INSTANCE METHOD (meaning its defined on all the documents and you can call it wherever)
//Check if the password is correct for logging in
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  //Return true if passwords match else false
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWT_TIMESTAMP) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    console.log(changedTimeStamp, JWT_TIMESTAMP);
    return JWT_TIMESTAMP < changedTimeStamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};
module.exports = mongoose.model("User", userSchema);
