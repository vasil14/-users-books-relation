const fs = require('fs');
const express = require('express');
const fastcsv = require('fast-csv');
const { resourceLimits } = require('worker_threads');
const app = express();

app.use(express.json());

const port = 3000;

const usersData = JSON.parse(fs.readFileSync('data/users.json'));
const booksData = JSON.parse(fs.readFileSync('data/books.json'));

// Users Data
function getUsers(usersData) {
  const users = usersData.map((user) => {
    return {
      id: user.userId,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  });
  const uniqueIds = [];

  const uniqueUsers = users.filter((user) => {
    const isDuplicate = uniqueIds.includes(user.id);

    if (!isDuplicate) {
      uniqueIds.push(user.id);

      return true;
    }

    return false;
  });
  return uniqueUsers;
}

// Find User
function findUser(userData, id) {
  const users = getUsers(userData);
  const user = users.find((user) => user.id == id);

  return user;
}

// Books Data
function getBooks(booksData) {
  const books = booksData.map((book) => {
    return {
      id: book.id,
      title: book.title,
      author: book.author,
      pages: book.pages,
    };
  });
  return books;
}

// Find Book
function findBook(booksData, id) {
  const books = getBooks(booksData);
  const book = books.find((book) => book.id == id);
  return book;
}

// Get all Users
app.get('/users', async (req, res) => {
  try {
    const users = await getUsers(usersData);
    res.send(users);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Get User by ID
app.get('/users/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const user = await findUser(usersData, id);

    if (!user) {
      res.status(404).send({ message: 'User not found!' });
    }

    res.send(user);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Export CSV file
app.get('/export', (req, res) => {
  let a = [];
  const data = usersData.forEach((user) => {
    for (let i = 0; i < user.readings.length; i++) {
      const book = findBook(booksData, user.readings[i].id);
      a.push({
        id: user.id,
        userId: user.userId,
        firstName: user.firstName,
        lastName: user.lastName,
        date: user.date,
        title: book.title,
        pagesRead: book.pages * user.readings[i].percentage,
      });
    }
  });

  const jsonData = JSON.stringify(a);
  const ws = fs.createWriteStream('data/export.csv');
  fastcsv
    .write(a, { headers: true })
    .on('finish', function () {
      res.send('File Exported!');
    })
    .pipe(ws);
});

// Get all Books
app.get('/books', async (req, res) => {
  try {
    const books = await getBooks(booksData);
    res.send(books);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Get Book by ID
app.get('/books/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const book = findBook(booksData, id);

    if (!book) {
      res.status(404).send({ message: 'Book not found!' });
    }

    res.send(book);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.listen(port, () => {
  console.log(`Servert is listening on port ${port}`);
});
