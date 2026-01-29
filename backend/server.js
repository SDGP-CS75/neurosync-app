const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.get('/health', (req, res) => {
  res.json({ message: 'Backend connected ✅' });
});



app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
