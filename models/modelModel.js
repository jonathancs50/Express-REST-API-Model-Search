const mongoose = require("mongoose");
const slugify = require("slugify");
const modelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: [40, "A name cannot have more than 40 characters"],
      minlength: [5, "A name must have atleast 6 character"],
    },
    slug: {
      type: String,
    },
    celebrity: {
      type: Boolean,
      default: false,
    },
    age: {
      type: Number,
      required: true,
    },
    height: {
      type: String,
      required: true,
    },
    weight: {
      type: String,
      required: true,
    },
    measurements: {
      bust: String,
      waist: String,
      hips: String,
      chest: String,
    },
    shoe_size: {
      type: String,
      required: true,
    },
    dress_size: String,
    hair_color: {
      type: String,
      required: true,
    },
    hair_length: {
      type: String,
      required: true,
    },
    eye_color: {
      type: String,
      required: true,
    },
    skin_tone: {
      type: String,
      required: true,
    },
    ethnicity: {
      type: String,
      required: true,
    },
    tattoos: {
      type: String,
      default: "None",
    },
    piercings: {
      type: String,
      default: "None",
    },
    distinctive_features: String,
    skills: {
      type: [String],
      default: [],
    },
    languages: {
      type: [String],
      default: [],
    },
    experience: {
      runway: {
        type: Boolean,
        default: false,
      },
      editorial: {
        type: Boolean,
        default: false,
      },
      commercial: {
        type: Boolean,
        default: false,
      },
    },
    social_media: {
      instagram: {
        type: String,
        unique: true, // Ensures the Instagram handle is unique
        sparse: true, // Allows multiple null values, preventing uniqueness errors for missing fields
      },
      twitter: {
        type: String,
        unique: true, // Ensures the Twitter handle is unique
        sparse: true, // Allows multiple null values
      },
      facebook: {
        type: String,
        unique: true, // Ensures the Facebook handle is unique
        sparse: true, // Allows multiple null values
      },
    },
    imageCover: {
      type: String,
      required: [true, "A model must have a photo cover"],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

modelSchema.virtual("ageRange").get(function () {
  if (this.age < 18) return "Underage";
  if (this.age <= 30) return "Young Adult";
  if (this.age <= 40 && this.age < 60) return "Adult";
  return "Senior Adult";
});

//MONGO document middleware  //run before .save() and .create()
modelSchema.pre("save", function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// modelSchema.post("save", function (next) {
//   console.log("This will run after the document is saved");
//   next();
// });

//QUERY MIDDLEWARE
modelSchema.pre(/^find/, function (next) {
  this.find({ celebrity: { $ne: true } });
  next();
});

//AGGREGATION MIDDLEWARE
modelSchema.pre("aggregate", function (next) {
  //this= aggreagation object
  this.pipeline().unshift({ $match: { celebrity: { $ne: true } } }); //Always makes the celebrity profile stay hidden by adding this specific aggreagate
  next();
});

const Model = mongoose.model("Model", modelSchema);

module.exports = Model;
