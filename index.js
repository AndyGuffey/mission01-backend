//? ===================================
//? BACKEND FOR TINA BOT CAR CLASSIFIER
//? ===================================

// this server acts as secure middle proxy between the frontend and Azure Custom Vision API
// Keeps Prediction key and enpoint secret, handles CORS for local & cloud use

require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();

// Enable CORS for all origins (dev & cloud deployment)
app.use(cors());

// Parse incoming JSON requests (larger size limit for image data)
app.use(express.json({ limit: "10mb" }));

// Load Azure Custom Vision endpoints and prediction keys from env variables
const baseEndpoint = process.env.CUSTOM_VISION_BASE_ENDPOINT;
const predictionKey = process.env.CUSTOM_VISION_PREDICTION_KEY;

// ==================================
// ==    Classify POST endpoint    ==
// ==================================
// Receives either an img URL or base64-encoded image data from the frontend
// Forwards the image to Azure Custom Vision API and returns the prediction result

app.post("/classify", async (req, res) => {
  try {
    let azureRes;
    // If the front end sent an img Url, use the /url endpoint
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
      //  If the frontend sent base64 img data, use the /image endpoint
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
      // If neither is submitted, return a 400 Bad Request
      return res.status(400).json({ error: "No image provided" });
    }
    // Return the prediction result from Azure to the frontend
    res.json(azureRes.data);
  } catch (err) {
    // If Azure returns an error, forward the error message to the frontend
    res.status(500).json({ error: err.message });
  }
});

// ==============================
// == Start the express server ==
// ==============================

// Use the port from environment variables (for Azure), or default to 4000 for local dev
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
