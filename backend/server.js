const express = require("express");
const cors = require("cors");
const uploadRoute = require("./routes/upload");
const consumptionRoute = require("./routes/consumption");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/upload", uploadRoute);
app.use("/api/consumption", consumptionRoute);

app.listen(5000, "0.0.0.0", () => {
  console.log("Server running on http://0.0.0.0:5000");
});
