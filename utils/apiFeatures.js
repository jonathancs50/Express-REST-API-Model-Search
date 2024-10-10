class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    //FILTERING
    const queryObj = { ...this.queryString };
    const excludeedFields = ["page", "sort", "limit", "fields"];
    //Delete the fields from query obj
    excludeedFields.forEach((el) => delete queryObj[el]);

    // ADVANCED FILTERING
    let queryStr = JSON.stringify(queryObj);

    //We want to add the $ sign so  { age: { gte: '22' } } ->  { age: { '$gte': '22' } }
    queryStr = queryStr.replace(/\b(gte|gt\lte\lt)\b/g, (match) => `$${match}`);

    //BUILD A QUERY
    //Two ways to do db queries
    //1)
    // const models = await Model.find({
    //   age: 23,
    // });
    //2)
    // const models=await models.find().where(age).equals(22);
    // let query = Model.find(JSON.parse(queryStr)); //query object = { age: { '$gte': '22' } }
    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  sort() {
    // SORTING
    if (this.queryString.sort) {
      // if we want to sort based on two fields in mongo we put a space but cannot have a space in the url so we use comma (find out more mongodb Query and Projection Operators)
      //req.query.sort= "-age,name"
      const sortBy = this.queryString.sort.split(",").join(" "); // req.query.sort= '-age name'

      this.query = this.query.sort(sortBy);
    } else {
      //Order it based on created time
      this.query = this.query.sort("-createdAt");
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(",").join(" ");
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select("-__v");
    }
    return this;
  }

  paginate() {
    //PAGINATION
    // page=2&limit=10, 1-10, page 1, 11-20, page 2
    const page = Number(this.queryString.page) || 1; //If page=2 then this.queryString.page=2 but if not specified default=1
    const limit = Number(this.queryString.limit) || 100;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    //pagination throw error if page doesnt exist e.g. page=500
    // if (this.queryString.page) {
    //   const numModelDocuments = await Model.countDocuments(); //gets the total amount of model profiles
    //   if (skip >= numModelDocuments) {
    //     throw new Error("This page does not exist");
    //   }
    // }
    return this;
  }
}

module.exports = APIFeatures;
