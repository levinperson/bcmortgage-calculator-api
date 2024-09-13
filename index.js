import express from "express";
import path from "path";
import { fileURLToPath } from "url";

// Create Express app
const app = express();
const port = 3000;

// Convert import.meta.url to a file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set up middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Mortgage calculator route with new inputs
app.post("/api/calculate-mortgage", (req, res) => {
  const {
    propertyPrice,
    downPayment,
    annualInterestRate,
    amortizationPeriod,
    paymentSchedule,
  } = req.body;

  // Missing fields check
  if (
    propertyPrice === undefined ||
    downPayment === undefined ||
    annualInterestRate === undefined ||
    amortizationPeriod === undefined ||
    paymentSchedule === undefined
  ) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  //Input data type checks
  if (
    typeof propertyPrice !== "number" ||
    typeof downPayment !== "number" ||
    typeof annualInterestRate !== "number" ||
    typeof amortizationPeriod !== "number"
  ) {
    return res.status(400).json({
      error:
        "propertyPrice, downPayment, annualInterestRate, and amortizationPeriod must be numbers",
    });
  }
  if (typeof paymentSchedule !== "string") {
    return res.status(400).json({ error: "paymentSchedule must be a string" });
  }

  //Input range checks
  if (propertyPrice <= 0) {
    return res
      .status(400)
      .json({ error: "propertyPrice must be greater than 0" });
  }
  if (downPayment <= 0) {
    return res
      .status(400)
      .json({ error: "downPayment must be greater than 0" });
  }
  if (downPayment > propertyPrice) {
    return res.status(400).json({
      error: "downPayment must be less than or equal to propertyPrice",
    });
  }
  if (annualInterestRate <= 0 || annualInterestRate > 100) {
    return res
      .status(400)
      .json({ error: "annualInterestRate must be between 0 and 100" });
  }

  //Define allowed values for paymentSchedule
  const allowedSchedules = ["monthly", "bi-weekly", "accelerated bi-weekly"];
  if (!allowedSchedules.includes(paymentSchedule)) {
    return res.status(400).json({
      error:
        "Invalid paymentSchedule. Allowed values are monthly, bi-weekly, accelerated bi-weekly",
    });
  }

  //-------------------------Implement restrictions for amortization period----------------------------------------//
  // Check for amortization period to be between 5 and 30 years
  if (amortizationPeriod < 5 || amortizationPeriod > 30) {
    return res.status(400).json({
      error: "Amortization period should be between 5 and 30 years",
    });
  }
  //The maximum amortization period on a CMHC insured mortgage is 25 years
  if (downPayment < propertyPrice * 0.2 && amortizationPeriod > 25) {
    return res.status(400).json({
      error:
        "The maximum amortization period on a CMHC insured mortgage is 25 years",
    });
  }
  //---------------------------------------------------------------------------------------------------------------//

  //Validate amortization period
  const validAmortizationPeriods = [5, 10, 15, 20, 25, 30];
  if (!validAmortizationPeriods.includes(amortizationPeriod)) {
    return res.status(400).json({
      error:
        "amortizationPeriod must be one of the following values: 5, 10, 15, 20, 25, 30 years",
    });
  }

  //-------------------------Implement restrictions for down payment-----------------------------------------------//
  // Check for property price condition with property price less or equal to $500K, minimum downpayment should be 5%
  if (propertyPrice <= 500000 && downPayment < propertyPrice * 0.05) {
    return res.status(400).json({
      error: "The minimum down payment should be 5%",
    });
  }

  // Check down payment requirement for homes between $500K and $1 million
  if (propertyPrice > 500000 && propertyPrice < 1000000) {
    const minDownPayment = 500000 * 0.05 + (propertyPrice - 500000) * 0.1;

    if (downPayment < minDownPayment) {
      return res.status(400).json({
        error:
          "For homes priced between $500K and $1 million, the down payment must be at least 5% of the first $500K and 10% of the amount over $500K",
      });
    }
  }

  // Check for property price condition with property price larger or equal to $1M
  if (propertyPrice >= 1000000 && downPayment < propertyPrice * 0.2) {
    return res.status(400).json({
      error:
        "For property price more than $1 million, please put more than 20% down",
    });
  }
  //---------------------------------------------------------------------------------------------------------------//

  //----------------------------------------Implement CMHC insurance rate------------------------------------------//
  let CMHCRate = 0;
  if (
    downPayment >= propertyPrice * 0.05 &&
    downPayment < propertyPrice * 0.1
  ) {
    CMHCRate = 0.04;
  } else if (
    downPayment >= propertyPrice * 0.1 &&
    downPayment < propertyPrice * 0.15
  ) {
    CMHCRate = 0.031;
  } else if (
    downPayment >= propertyPrice * 0.15 &&
    downPayment < propertyPrice * 0.2
  ) {
    CMHCRate = 0.028;
  } else {
    CMHCRate = 0.0;
  }
  //---------------------------------------------------------------------------------------------------------------//

  // Calculate the total principal
  const principal = (propertyPrice - downPayment) * (CMHCRate + 1);

  // Convert annual interest rate to monthly and bi-weekly
  const monthlyInterestRate = annualInterestRate / 100 / 12;
  const biweeklyInterestRate = annualInterestRate / 100 / 26;

  // Convert amortization period to months and bi-weeks
  const totalPayments = amortizationPeriod * 12;
  const totalPaymentsBiweekly = amortizationPeriod * 26;

  // Calculate monthly payment using the formula
  const monthlyPayment =
    (principal *
      monthlyInterestRate *
      Math.pow(1 + monthlyInterestRate, totalPayments)) /
    (Math.pow(1 + monthlyInterestRate, totalPayments) - 1);

  // Calculate bi-weekly payment using the formula
  const biweeklyPayment =
    (principal *
      biweeklyInterestRate *
      Math.pow(1 + biweeklyInterestRate, totalPaymentsBiweekly)) /
    (Math.pow(1 + biweeklyInterestRate, totalPaymentsBiweekly) - 1);

  // Calculate payments based on the selected schedule
  let paymentPerSchedule;

  if (paymentSchedule === "monthly") {
    paymentPerSchedule = monthlyPayment;
  } else if (paymentSchedule === "bi-weekly") {
    // paymentPerSchedule = (monthlyPayment * 12) / 26;
    paymentPerSchedule = biweeklyPayment;
  } else if (paymentSchedule === "accelerated bi-weekly") {
    paymentPerSchedule = monthlyPayment / 2;
  } else {
    return res.status(400).json({ error: "Invalid payment schedule" });
  }

  // Return the calculated payment per schedule
  res.json({
    paymentSchedule,
    paymentAmount: paymentPerSchedule.toFixed(2),
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Mortgage Calculator API is running on http://localhost:${port}`);
});

// Export the app as the default export
export default app;
