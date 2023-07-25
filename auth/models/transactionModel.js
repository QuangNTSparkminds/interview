const mongoose = require("mongoose");
const transactionSchema = new mongoose.Schema(
  {
    address: {
      type: String,
      required: true,
    },
    hash: {
      type: String,
      required: true,
    },
    currency: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);
