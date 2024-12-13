const mongoose = require("mongoose");

// Define the schema for the MatchColumnFormData1 model
const matchColumnSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true,
  },
  topic: {
    type: String,
    required: true,
  },
  subtopic: {
    type: String,
    required: false,
  },
  level: {
    type: String,
    enum: ["easy", "medium", "hard"],
    default: "easy",
  },
  type: {
    type: String,
    required: true,
  },
  leftOptionsA: {
    type: String,
    required: true,
  },
  leftOptionsB: {
    type: String,
    required: true,
  },
  leftOptionsC: {
    type: String,
    required: true,
  },
  leftOptionsD: {
    type: String,
    required: true,
  },
  rightOptionsA: {
    type: String,
    required: true,
  },
  rightOptionsB: {
    type: String,
    required: true,
  },
  rightOptionsC: {
    type: String,
    required: true,
  },
  rightOptionsD: {
    type: String,
    required: true,
  },
  leftImagesA: {
    type: String, // Store as Base64 encoded string (you can change this type based on how you store the file)
    required: false,
  },
  leftImagesB: {
    type: String,
    required: false,
  },
  leftImagesC: {
    type: String,
    required: false,
  },
  leftImagesD: {
    type: String,
    required: false,
  },
  rightImagesA: {
    type: String,
    required: false,
  },
  rightImagesB: {
    type: String,
    required: false,
  },
  rightImagesC: {
    type: String,
    required: false,
  },
  rightImagesD: {
    type: String,
    required: false,
  },
  correctMatchings: [
    {
      rightOption: {
        type: Number,
        required: true,
      },
    },
  ],
  optionType: {
    type: String,
    enum: ["text", "textImage"],
    default: "text",
  },
  description: {
    type: String,
    required: true,
  },
  descriptionImage: {
    type: String, // This will store the Base64 encoded image string
    required: false,
  },
});

// Create the model from the schema
const MatchColumn = mongoose.model("MatchColumn", matchColumnSchema);

module.exports = MatchColumn;
