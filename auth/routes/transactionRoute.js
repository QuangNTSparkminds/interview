const express = require("express");
const { newTransaction } = require("../controllers/transactionController");

const router = express.Router();

router.route("/transaction/new").post(newTransaction);

module.exports = router;
