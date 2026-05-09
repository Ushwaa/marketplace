const mongoose = require('mongoose');
const Product = require('../models/productModel');
const AppError = require('../AppError');
const catchAsync = require('../utils/catchAsync');

// middleware ---------------------------------------------------------------
exports.checkID = async (req, res, next, val) => {
  if (val.length !== 24 || !mongoose.Types.ObjectId.isValid(val)) {
    return next(new AppError(`Invalid ID format: ${val}`, 400));
  }
  
  try {
    const product = await Product.findById(val);
    if (!product) {
      return next(new AppError('Invalid ID: product not found', 404));
    }
    req.product = product;
    next();
  } catch (err) {
    return next(new AppError('Invalid ID', 400));
  }
};

// Note: checkBody middleware removed - mongoose validation now handles this

exports.aliasTopProducts = (req, res, next) => {
  req.query.limit = '3';
  req.query.sort = 'price';
  req.query.fields = 'name,price,category,seller';
  next();
};

// route handlers -----------------------------------------------------------
exports.getAllProducts = catchAsync(async (req, res) => {
  // 1) Build query
  const queryObj = { ...req.query };
  const excludedFields = ['page', 'sort', 'limit', 'fields'];
  excludedFields.forEach(field => delete queryObj[field]);

  let queryStr = JSON.stringify(queryObj);
  queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

  let query = Product.find(JSON.parse(queryStr));

  // 2) Sorting
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('price');
  }

  // 3) Field limiting
  if (req.query.fields) {
    const fields = req.query.fields.split(',').join(' ');
    query = query.select(fields);
  }

  // 4) Pagination
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 100;
  const skip = (page - 1) * limit;

  query = query.skip(skip).limit(limit);

  if (req.query.page) {
    const numProducts = await Product.countDocuments(JSON.parse(queryStr));
    if (skip >= numProducts) {
      throw new AppError('This page does not exist', 404);
    }
  }

  const products = await query;

  // 5) Send response
  res.status(200).json({
    status: 'success',
    results: products.length,
    data: { products }
  });
});

exports.getProduct = (req, res) => {
  res.status(200).json({
    status: 'success',
    data: { product: req.product }
  });
};

exports.createProduct = catchAsync(async (req, res) => {
  // Set user to current logged in user
  req.body.user = req.user.id;
  
  const product = new Product(req.body);
  const newProduct = await product.save();
  res.status(201).json({ status: 'success', data: { product: newProduct } });
});

exports.updateProduct = catchAsync(async (req, res) => {
  const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  if (!updatedProduct) {
    throw new AppError('Product not found', 404);
  }
  res.status(200).json({ status: 'success', data: { product: updatedProduct } });
});

exports.deleteProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  // Check if user owns the product or is admin
  if (product.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You do not have permission to delete this product', 403));
  }

  await Product.findByIdAndDelete(req.params.id);
  res.status(204).json({ status: 'success', data: null });
});

exports.getProductStats = catchAsync(async (req, res) => {
  const stats = await Product.aggregate([
    {
      $match: { price: { $lt: 1000 } }
    },
    {
      $group: {
        _id: '$category',
        numProducts: { $sum: 1 },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    },
    {
      $sort: { avgPrice: 1 }
    }
  ]);

  res.status(200).json({
    status: 'success',
    results: stats.length,
    data: { stats }
  });
});
