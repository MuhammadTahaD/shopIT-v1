class APIFilters {
  constructor(query, queryStr) {
    this.query = query;
    this.queryStr = queryStr;
  }

  search() {
    const keyword = typeof this.queryStr.keyword === "string" && this.queryStr.keyword.trim()
      ? {
          name: {
            $regex: this.queryStr.keyword.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
            $options: "i",
          },
        }
      : {};

    this.query = this.query.find({ ...keyword });
    return this;
  }

  filters() {
    const queryCopy = { ...this.queryStr };

    // Fields to remove
    const fieldsToRemove = ["keyword", "page", "limit", "sort"];
    fieldsToRemove.forEach((el) => delete queryCopy[el]);

    // Advance filter for price, ratings etc
    let queryStr = JSON.stringify(queryCopy);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  sort() {
    const sortOptions = {
      price: { price: 1 },
      "-price": { price: -1 },
      "-createdAt": { createdAt: -1 },
      "-ratings": { ratings: -1 },
    };

    this.query = this.query.sort(sortOptions[this.queryStr.sort] || sortOptions["-createdAt"]);
    return this;
  }

  pagination(resPerPage, currentPage) {
    const skip = resPerPage * (currentPage - 1);

    this.query = this.query.limit(resPerPage).skip(skip);
    return this;
  }
}

export default APIFilters;
