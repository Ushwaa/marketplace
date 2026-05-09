# Marketplace API Testing Guide

## Base URL
```
http://localhost:3000/api/v1
```

## Testing Checklist

### 1. SIGNUP AND LOGIN

#### Signup - User
```
POST /auth/signup
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "passwordConfirm": "password123",
  "role": "user"
}
```

#### Signup - Admin
```
POST /auth/signup
Content-Type: application/json

{
  "name": "Admin User",
  "email": "admin@example.com",
  "password": "password123",
  "passwordConfirm": "password123",
  "role": "admin"
}
```

#### Login
```
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### 2. PROTECTED ROUTES - Get All Products

#### Test 1: Without Token (Should fail with 401)
```
GET /products
```

#### Test 2: With Valid Token
```
GET /products
Authorization: Bearer <token_from_login>
```

#### Test 3: With Invalid Token
```
GET /products
Authorization: Bearer invalid_token_here
```

#### Test 4: With Expired Token
(Create a token and wait for it to expire, or modify JWT_EXPIRES_IN in config.env to 1s temporarily)

#### Test 5: With Deleted User Token
(Delete the user after login, then use their old token)

#### Test 6: With Expired Password
(Change password, then use old token from before password change)

### 3. AUTHORIZATION - Delete Product

#### Create Product (Logged in as regular user)
```
POST /products
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "name": "Sample Product",
  "price": 99.99,
  "category": "Electronics",
  "seller": "JohnDoe",
  "description": "Sample product"
}
```

#### Delete Product as Owner (Should succeed)
```
DELETE /products/{productId}
Authorization: Bearer <user_token>
```

#### Delete Product as Non-Owner Regular User (Should fail with 403)
```
DELETE /products/{productId}
Authorization: Bearer <other_user_token>
```

#### Delete Product as Admin (Should succeed)
```
DELETE /products/{productId}
Authorization: Bearer <admin_token>
```

### 4. PASSWORD MANAGEMENT

#### Forgot Password
```
POST /auth/forgotPassword
Content-Type: application/json

{
  "email": "john@example.com"
}
```
(Save the resetToken from the response)

#### Reset Password
```
PATCH /auth/resetPassword/{resetToken}
Content-Type: application/json

{
  "password": "newPassword123",
  "passwordConfirm": "newPassword123"
}
```

#### Update Current User Password
```
PATCH /users/updateMyPassword
Authorization: Bearer <token>
Content-Type: application/json

{
  "passwordCurrent": "password123",
  "password": "newPassword123",
  "passwordConfirm": "newPassword123"
}
```

### 5. USER PROFILE

#### Update Current User
```
PATCH /users/updateMe
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "New Name",
  "email": "newemail@example.com",
  "photo": "photo.jpg"
}
```

#### Get Current User
```
GET /users/me
Authorization: Bearer <token>
```

#### Delete Current User
```
DELETE /users/deleteMe
Authorization: Bearer <token>
```

### 6. SECURITY TESTING

#### Test XSS Prevention
Submit HTML in product description:
```
POST /products
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Test Product",
  "price": 99.99,
  "category": "Electronics",
  "seller": "JohnDoe",
  "description": "<script>alert('XSS')</script>"
}
```

#### Test HPP (HTTP Parameter Pollution)
```
GET /products?sort=-price&sort=price
Authorization: Bearer <token>
```

#### Test Rate Limiting
Make more than 100 requests to /api routes within an hour.

#### Test Helmet Headers
```
GET /products
Authorization: Bearer <token>
```
Check response headers in the Headers tab.

### 7. COOKIES

When logging in or signing up, check the Cookies tab to verify JWT is stored:
- Cookie name: `jwt`
- Should be httpOnly
- Should be secure in production

## Expected Results

✅ All tests should pass
✅ Passwords should be encrypted in database
✅ JWTs should be valid for 90 days
✅ Rate limiting should be active
✅ Security headers should be present
✅ No XSS vulnerabilities
✅ No NoSQL injection vulnerabilities
✅ Data sanitization should be working
