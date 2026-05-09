const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A product must have a name'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'A product must have a price']
  },
  priceDiscount: {
    type: Number,
    validate: {
      validator: function(val) {
        if (!val) return true; // Allow undefined/null
        return val < this.price;
      },
      message: 'Discount price ({VALUE}) should be below regular price'
    }
  },
  category: {
    type: String,
    required: [true, 'A product must have a category'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [50, 'Description must not exceed 50 characters']
  },
  seller: {
    type: String,
    required: [true, 'A product must have a seller'],
    trim: true
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'A product must belong to a user']
  },
  postedDate: {
    type: Date,
    default: Date.now
  },
  productSlug: {
    type: String,
    unique: true,
    sparse: true // Allow null values
  },
  premiumProducts: {
    type: Boolean,
    default: false
  }
});

// ============= VIRTUAL PROPERTIES =============
// Virtual property: days posted
productSchema.virtual('daysPosted').get(function() {
  if (!this.postedDate) return 0;
  const now = new Date();
  const diff = Math.floor((now - this.postedDate) / (1000 * 60 * 60 * 24));
  return diff;
});

// ============= DOCUMENT MIDDLEWARE =============
// Document Middleware: pre('save') - slugify product name in upper case
productSchema.pre('save', function() {
  if (this.isNew && this.name) {
    this.productSlug = this.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .toUpperCase();
  }
});

// ============= QUERY MIDDLEWARE =============
// Query Middleware: exclude premium products from all find operations
// NOTE: For mongoose 9.x, these hooks should be written without calling next()
// unless the middleware signature explicitly expects it.
productSchema.pre(/^find/, function() {
  this.find({ premiumProducts: { $ne: true } });
});

// ============= AGGREGATION MIDDLEWARE =============
// Aggregate Middleware: pre('aggregate') - only non-premium products
productSchema.pre('aggregate', function() {
  const pipeline = this.pipeline();
  if (Array.isArray(pipeline)) {
    pipeline.unshift({ $match: { premiumProducts: { $ne: true } } });
  }
});



productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

const Product = mongoose.model('Product', productSchema, 'products');

module.exports = Product;
