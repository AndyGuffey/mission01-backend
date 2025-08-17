require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

const baseEndpoint = process.env.CUSTOM_VISION_BASE_ENDPOINT;
const predictionKey = process.env.CUSTOM_VISION_PREDICTION_KEY;

app.post("/classify", async (req, res) => {
  try {
    let azureRes;
    if (req.body.imageUrl) {
      azureRes = await axios.post(
        `${baseEndpoint}/url`,
        { Url: req.body.imageUrl },
        {
          headers: {
            "Content-Type": "application/json",
            "Prediction-Key": predictionKey,
          },
        }
      );
    } else if (req.body.imageData) {
      azureRes = await axios.post(
        `${baseEndpoint}/image`,
        Buffer.from(req.body.imageData, "base64"),
        {
          headers: {
            "Content-Type": "application/octet-stream",
            "Prediction-Key": predictionKey,
          },
        }
      );
    } else {
      return res.status(400).json({ error: "No image provided" });
    }
    res.json(azureRes.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
