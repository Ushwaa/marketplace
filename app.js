const express = require('express');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const productRouter = require('./routes/productRoutes');
const authRouter = require('./routes/authRoutes');
const userRouter = require('./routes/userRoutes');
const replaceTemplate = require('./modules/replaceTemplate');
const catchAsync = require('./utils/catchAsync');
const AppError = require('./AppError');

const app = express();

// Trust proxy (required for Render/Heroku deployments)
app.set('trust proxy', 1);

// 1. PRE-LOAD DATA & TEMPLATES (Requirement: fs.readFileSync)
// These are loaded once at startup to improve performance
const tempItem = fs.readFileSync(`${__dirname}/templates/template-item.html`, 'utf-8');
const data = fs.readFileSync(`${__dirname}/data/products.json`, 'utf-8');
const productsObj = JSON.parse(data);

// 2. MIDDLEWARE

// SECURITY HEADERS
app.use(helmet());

// LOGGING
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// LIMIT REQUESTS from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!'
});
app.use('/api', limiter);

// BODY PARSER
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ limit: '10kb', extended: true }));
app.use(cookieParser());

// DATA SANITIZATION against NoSQL query injection
app.use(mongoSanitize());

// DATA SANITIZATION against XSS
app.use(xss());

// PREVENT HTTP PARAMETER POLLUTION
app.use(hpp({
  whitelist: ['price', 'priceDiscount', 'category', 'seller']
}));

// Requirement: Static Files
// This serves your public/index.html automatically when you visit http://localhost:3000/
app.use(express.static(`${__dirname}/public`));

// Requirement #2: Custom Middleware (Global)
app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    console.log('Hello from the middleware 👋');

    // Requirement: Uncaught Exceptions logic (intentionally trigger a ReferenceError)
    // Trigger only when client requests /debug/uncaught-exception
    if (req.path === '/debug/uncaught-exception') {
        // eslint-disable-next-line no-undef
        console.log(undefinedVariableInMiddleware);
    }

    next();
});

// 3. ROUTES
// Requirement: Template 3 / Item Detail Logic
// Uses query strings (?id=) and the custom replaceTemplate module
app.get('/item', catchAsync(async (req, res) => {
    const id = req.query.id;
    const product = productsObj[id];

    if (!product) {
        return res.status(404).send('<h1>Product not found!</h1>');
    }

    const output = replaceTemplate(tempItem, product);
    res.status(200).set('Content-Type', 'text/html').send(output);
}));

// AUTHENTICATION ROUTES
app.use('/api/v1/auth', authRouter);

// USER ROUTES
app.use('/api/v1/users', userRouter);

// PRODUCT ROUTES - Protected
const authController = require('./controllers/authController');
app.use('/api/v1/products', authController.protect, productRouter);

// ERROR HANDLING for non-existent routes
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// GLOBAL ERROR HANDLING MIDDLEWARE
app.use(require('./errorController'));

// 4. EXPORT
module.exports = app;