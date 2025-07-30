CREATE TABLE books (
  id            INTEGER PRIMARY KEY ,
  title         TEXT    NOT NULL,
  author        TEXT    NOT NULL,
  genre         TEXT    NOT NULL,
  price         REAL    NOT NULL,
  image         TEXT,
  description   TEXT,
  featured      INTEGER NOT NULL DEFAULT 0,
  coming_soon   INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE users (
  id                  INTEGER PRIMARY KEY ,
  name                TEXT    NOT NULL,
  email               TEXT    UNIQUE NOT NULL,
  password            TEXT    NOT NULL,
  street              TEXT,
  city                TEXT,
  state               TEXT,
  zip                 TEXT,
  stripe_customer_id  TEXT    UNIQUE,
  default_stripe_payment_method_id  TEXT,
  promotion_opt_in    INTEGER NOT NULL DEFAULT 0,
  status              TEXT    NOT NULL DEFAULT 'inactive',
  confirmation_token  TEXT,
  is_admin            INTEGER NOT NULL DEFAULT 0,
  reset_token         TEXT,
  reset_expires       INTEGER
);

CREATE TABLE orders (
    id INTEGER PRIMARY KEY ,
    user_id INTEGER NOT NULL,
    total REAL NOT NULL,
    subtotal REAL,
    tax REAL,
    shipping_name TEXT,
    shipping_street TEXT,
    shipping_city TEXT,
    shipping_state TEXT,
    shipping_zip TEXT,
    stripe_payment_intent_id TEXT UNIQUE NOT NULL, -- Store the PI ID
    payment_display TEXT,
    order_date TEXT,
    status TEXT DEFAULT 'pending', promo_code_applied TEXT, discount_amount REAL, -- e.g., 'pending', 'completed', 'failed'
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE promotions (
    id                  INTEGER PRIMARY KEY ,
    code                TEXT UNIQUE NOT NULL,
    discount_percentage REAL NOT NULL,     
    start_date          TEXT NOT NULL,     
    end_date            TEXT NOT NULL,     
    is_active           INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE order_items (
    id INTEGER PRIMARY KEY ,
    order_id INTEGER NOT NULL,
    book_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    price_at_purchase REAL NOT NULL,
    title_at_purchase TEXT, image_at_purchase TEXT,
    FOREIGN KEY (order_id) REFERENCES orders(id)
);

INSERT INTO books (title, author, genre, price, image, description, featured, coming_soon) VALUES
('The Alchemist', 'Paulo Coelho', 'Fiction', 12.99, 'assets/book_images/alchemist.jpg', 'A magical fable about following your dreams.', 1, 0),
('1984', 'George Orwell', 'Science Fiction', 9.99, 'assets/book_images/1984.jpg', 'A dystopian novel about totalitarianism.', 1, 0),
('To Kill a Mockingbird', 'Harper Lee', 'Fiction', 10.50, 'assets/book_images/mockingbird.jpg', 'A story of racial injustice in the American South.', 1, 0),
('The Great Gatsby', 'F. Scott Fitzgerald', 'Fiction', 8.99, 'assets/book_images/gatsby.jpg', 'A portrait of the Jazz Age in all of its decadence.', 1, 0),
('The Hobbit', 'J.R.R. Tolkien', 'Fantasy', 11.25, 'assets/book_images/hobbit.jpg', 'A fantasy novel about the quest of home-loving Bilbo Baggins.', 1, 0),
('Sunrise on the Reaping', 'Suzanne Collins', 'Science Fiction', 14.99, 'assets/book_images/sunrise_reaping.jpg', 'A new Hunger Games novel.', 0, 1),
('Onyx Storm', 'Rebecca Yarros', 'Fantasy', 13.99, 'assets/book_images/onyx_storm.jpg', 'The next thrilling installment in the Empyrean series.', 0, 1),
('Broken Country', 'Clare', 'Mystery', 12.50, 'assets/book_images/broken_country.jpg', 'A gripping mystery set in rural England.', 0, 1);


INSERT INTO users (
  name, email, password, status, is_admin
) VALUES (
  'Demo Admin',
  'admin@bookstore.com',
  '$2b$10$cZ.WXnPghlcveU8YuhcL9eWnHUavrdcC/dIKCW0sPOMXvUDjgAbi6',
  'active',
  1
);