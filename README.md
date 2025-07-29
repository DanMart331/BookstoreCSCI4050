# Software Engineering (CSCI 4050), Team 7 - Online Book Store Website

# Features:
- User Registration
- User/Admin Login/Logout
- Edit Profile
- Functioning Shopping Cart (Add to Cart, Remove from cart, Increase/Decrease Item Count, etc)
- Add/Delete Books (Admin Feature)

# Tech Stack:
- Backend: Node.js, Express
- Database: MySQLite3
- Frontend: HTML, CSS, JavaScript


# How to run the server

1. Move to server directory:

  `cd online-bookstore-ui`
  
  `cd server`

2. Install Dependencies

  `npm install`

3. Start server

  `npm run dev`

  Server should now be running on localhost:3000

## 📋 System Requirements

### 🧑‍💼 Account Management

- Users must be able to:
  - Register with: name, phone number, email, and password
  - Optionally add shipping and payment info
  - Recover a forgotten password
- Account activation requires email verification
- Each account has a unique Account ID
- Passwords and card numbers must be **encrypted**
- Admin users can:
  - Add new employees
  - Promote or demote users to/from admin
  - Suspend user accounts

---

### 📦 Book Inventory Management

- Admins must be able to add, update, and delete book records
- Each book includes:
  - ISBN (unique)
  - Category
  - Title
  - Edition
  - Authors
  - Publisher
  - Publication Year
  - Cover Image
  - Quantity in stock
  - Minimum quantity threshold
  - Buying price
  - Selling price

---

### 🔐 Login & Authentication

- Secure login with:
  - Account ID or email
  - Password
- Must support multi-user access
- All actions must be authenticated
- System must verify user role:
  - Guest
  - Registered Customer
  - Admin

---

### 🛍️ Shopping Cart & Orders

- Registered users can:
  - Add/remove items from a cart
  - Place an order using saved or new info
  - Apply promotional codes
  - View past order history
  - Track delivery status
  - Reorder previous items
- Order records must include:
  - Order ID
  - Customer ID
  - Date & time
  - List of books ordered
  - Shipping address
  - Payment method
  - Total cost
  - Order status

---

### 🎁 Promotions

- Admins can:
  - Create promotional codes
    - Specify discount %, start & end dates
  - Email promotional offers to users
- Promotion rules:
  - Once sent by email, promotions cannot be modified
  - Users can opt in/out of promotional emails

---

### 🔎 Book Catalog & Search

- All users can:
  - Browse/search the catalog
  - Filter by:
    - Title
    - Author
    - Category
    - ISBN
  - View books sorted by title
  - See:
    - Title
    - Cover image
    - Author(s)
    - Rating
    - Price

---

### 🙍‍♂️ User Profile

- Users can:
  - View and edit profile info
  - Manage promo email subscription

---

### 📧 Email Notifications

- Upon registration:
  - Email confirmation is sent to activate the account
- Upon order:
  - Order confirmation email must include:
    - Customer name
    - Confirmation number
    - Order ID & date
    - Shipping info
    - Ordered items
    - Total cost

---

### 💻 Technical Requirements

- Web-based interface (compatible with Chrome, Firefox, Safari, Edge)
- Role-based access control with specific UI for:
  - Guest
  - Customer
  - Admin
- Use **MySQL** for persistent data storage
- Technologies:
  - HTML, CSS, JS
  - Backend: Java, Python, or C++
  - Optional: JDBC, PHP, Express, etc.


