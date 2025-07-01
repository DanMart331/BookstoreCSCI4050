-- Sample data for books table
INSERT INTO books (title, author, genre, price, image, description, featured, coming_soon) VALUES
('The Alchemist', 'Paulo Coelho', 'Fiction', 12.99, 'assets/book_images/alchemist.jpg', 'A magical fable about following your dreams.', 1, 0),
('1984', 'George Orwell', 'Science Fiction', 9.99, 'assets/book_images/1984.jpg', 'A dystopian novel about totalitarianism.', 1, 0),
('To Kill a Mockingbird', 'Harper Lee', 'Fiction', 10.50, 'assets/book_images/mockingbird.jpg', 'A story of racial injustice in the American South.', 1, 0),
('The Great Gatsby', 'F. Scott Fitzgerald', 'Fiction', 8.99, 'assets/book_images/gatsby.jpg', 'A portrait of the Jazz Age in all of its decadence.', 1, 0),
('The Hobbit', 'J.R.R. Tolkien', 'Fantasy', 11.25, 'assets/book_images/hobbit.jpg', 'A fantasy novel about the quest of home-loving Bilbo Baggins.', 1, 0),
('Sunrise on the Reaping', 'Suzanne Collins', 'Science Fiction', 14.99, 'assets/book_images/sunrise_reaping.jpg', 'A new Hunger Games novel.', 0, 1),
('Onyx Storm', 'Rebecca Yarros', 'Fantasy', 13.99, 'assets/book_images/onyx_storm.jpg', 'The next thrilling installment in the Empyrean series.', 0, 1),
('Broken Country', 'Clare', 'Mystery', 12.50, 'assets/book_images/broken_country.jpg', 'A gripping mystery set in rural England.', 0, 1);

-- Sample admin user
INSERT INTO users (name, email, password, is_admin) VALUES
('Admin User', 'admin@bookstore.com', '$2b$10$examplehashedpassword', 1);