const asyncErrorHandler = require("../middlewares/helpers/asyncErrorHandler");
const Transaction = require("../models/transactionModel");
const ErrorHandler = require("../utils/errorHandler");
const sendEmail = require("../utils/sendEmail");

// Create New Transaction
exports.newTransaction = asyncErrorHandler(async (req, res, next) => {
  const { address, hash, currency, amount } = req.body;

  const transactionExist = await Transaction.findOne({ address, hash });

  if (transactionExist) {
    return next(new ErrorHandler("Transaction Already exists.", 400));
  }

  const transaction = await Transaction.create({
    address,
    hash,
    currency,
    amount,
  });

  res.status(201).json({
    success: true,
    transaction,
  });
});
