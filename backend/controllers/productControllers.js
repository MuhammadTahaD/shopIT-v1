import catchAsyncErrors from "../middlewares/catchAsyncErrors.js";
import Product from "../models/product.js";
import APIFilters from "../utils/apiFilters.js";
import ErrorHandler from "../utils/ErrorHandler.js";

// Get all products => /api/v1/products
export const getProducts = catchAsyncErrors(async (req, res, next) => {
  const requestedLimit = Number(req.query.limit);
  const resPerPage = Number.isInteger(requestedLimit) && requestedLimit > 0
    ? Math.min(requestedLimit, 48)
    : 12;
  const requestedPage = Number(req.query.page);
  const currentPage = Number.isInteger(requestedPage) && requestedPage > 0
    ? requestedPage
    : 1;
  const apiFilters = new APIFilters(Product, req.query).search().filters();
  const filteredQuery = apiFilters.query.getFilter();

  apiFilters.sort().pagination(resPerPage, currentPage);
  const [products, filteredProductsCount] = await Promise.all([
    apiFilters.query,
    Product.countDocuments(filteredQuery),
  ]);

  res.status(200).json({
    success: true,
    resPerPage,
    filteredProductsCount,
    totalPages: Math.ceil(filteredProductsCount / resPerPage),
    currentPage,
    products,
  });
});

// Create new Product => /api/v1/admin/products
export const newProduct = catchAsyncErrors(async (req, res, next) => {
  req.body.user = req.user._id;

  const product = await Product.create(req.body);

  res.status(201).json({
    success: true,
    product,
  });
});

// Get single product details => /api/v1/products/:id
export const getProductDetails = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  res.status(200).json({
    success: true,
    product,
  });
});

// Update product details => /api/v1/products/:id
export const updateProduct = catchAsyncErrors(async (req, res, next) => {
  let product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
    product,
  });
});

// Delete product => /api/v1/products/:id
export const deleteProduct = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  await product.deleteOne();

  res.status(200).json({
    success: true,
    message: "Product Deleted",
  });
});



// Create / Update Product review => /api/v1/reviews
export const createProductReview = catchAsyncErrors(async (req, res, next) => {
  const { rating, comment, productId } = req.body;

  const review = {
    user: req.user._id,
    rating: Number(rating),
    comment,
  };

  const product = await Product.findById(productId);

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  const existingReview = product.reviews.find(
    (r) => r.user.toString() === req.user._id.toString()
  );

  if (existingReview) {
    existingReview.comment = comment;
    existingReview.rating = Number(rating);
  } else {
    product.reviews.push(review);
  }

  product.numOfReviews = product.reviews.length;

  product.ratings = product.reviews.length === 0
    ? 0
    : product.reviews.reduce((acc, item) => acc + item.rating, 0) / product.reviews.length;

  await product.save({ validateBeforeSave: false });

  res.status(200).json({ success: true });
});

// Get Product review => /api/v1/reviews
export const getProductReviews = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.query.id)
  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }
  res.status(200).json({
    reviews: product.reviews,
  });
});


// Delete Product review => /api/v1/admin/reviews
export const deleteReview = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.query.productId);

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  // Filter out the deleted review
  const reviews = product.reviews.filter(
    (review) => review._id.toString() !== req.query.id.toString()
  );

  const numOfReviews = reviews.length;
  const ratings = numOfReviews === 0
    ? 0
    : reviews.reduce((acc, item) => acc + item.rating, 0) / numOfReviews;

  // Update product directly
  product.reviews = reviews;
  product.numOfReviews = numOfReviews;
  product.ratings = ratings;

  await Product.findByIdAndUpdate(
    req.query.productId,
    { reviews, numOfReviews, ratings},
    { new : true }
  );

  res.status(200).json({
    success: true,
    message: "Review deleted successfully"
  });
});



