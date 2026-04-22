const express = require('express');
const app = express();

app.use(express.json());

// Home route
app.get('/', (req, res) => {
  res.send("Student Notes App Running");
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});