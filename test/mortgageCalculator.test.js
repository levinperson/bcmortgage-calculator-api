import { expect } from "chai";
import request from "supertest";
import app from "../index.js";

describe("Mortgage Calculator API", () => {
  // Test a successful mortgage calculation less than $1 million (with CMHC insurance)
  it("should return the correct payment amount for a valid request", (done) => {
    request(app)
      .post("/api/calculate-mortgage")
      .send({
        propertyPrice: 300000,
        downPayment: 40000,
        annualInterestRate: 5,
        amortizationPeriod: 25,
        paymentSchedule: "monthly",
      })
      .expect(200) // Check status code
      .expect("Content-Type", /json/) // Ensure response is JSON
      .end((err, res) => {
        if (err) return done(err); // Handle errors
        expect(res.body).to.be.an("object"); // Ensure response is an object
        expect(res.body).to.have.property("paymentAmount"); // Check for the paymentAmount property
        const expectedPaymentAmount = 1567.05;
        // Convert paymentAmount to a number
        const paymentAmount = parseFloat(res.body.paymentAmount);
        expect(paymentAmount).to.be.a("number"); // Ensure paymentAmount is a number
        expect(paymentAmount).to.equal(expectedPaymentAmount); // Check if paymentAmount equals the expected value
        done(); //Test is completed
      });
  });

  // Test a successful mortgage calculation larger than $1 million (without CMHC insurance)
  it("should return the correct payment amount for a valid request", (done) => {
    request(app)
      .post("/api/calculate-mortgage")
      .send({
        propertyPrice: 1500000,
        downPayment: 450000,
        annualInterestRate: 5,
        amortizationPeriod: 25,
        paymentSchedule: "bi-weekly",
      })
      .expect(200) // Check status code
      .expect("Content-Type", /json/) // Ensure response is JSON
      .end((err, res) => {
        if (err) return done(err); // Handle errors
        expect(res.body).to.be.an("object"); // Ensure response is an object
        expect(res.body).to.have.property("paymentAmount"); // Check for the paymentAmount property
        const expectedPaymentAmount = 2831.42;
        // Convert paymentAmount to a number
        const paymentAmount = parseFloat(res.body.paymentAmount);
        expect(paymentAmount).to.be.a("number"); // Ensure paymentAmount is a number
        expect(paymentAmount).to.equal(expectedPaymentAmount); // Check if paymentAmount equals the expected value
        done(); //Test is completed
      });
  });

  // Test missing fields
  it("should return 400 for missing required fields", (done) => {
    request(app)
      .post("/api/calculate-mortgage")
      .send({
        propertyPrice: 600000,
        downPayment: 50000,
        annualInterestRate: 3,
        // Missing amortizationPeriod and paymentSchedule
      })
      .expect(400) // Check status code
      .expect("Content-Type", /json/) // Ensure response is JSON
      .end((err, res) => {
        if (err) return done(err); // Handle errors
        expect(res.body)
          .to.have.property("error")
          .eql("Missing required fields");
        done();
      });
  });

  // Test input data type
  it("should return 400 for wrong input data type", (done) => {
    request(app)
      .post("/api/calculate-mortgage")
      .send({
        propertyPrice: 300000,
        downPayment: "hello",
        annualInterestRate: 5,
        amortizationPeriod: 25,
        paymentSchedule: "monthly",
      })
      .expect(400) // Check status code
      .expect("Content-Type", /json/) // Ensure response is JSON
      .end((err, res) => {
        if (err) return done(err); // Handle errors
        expect(res.body)
          .to.have.property("error")
          .eql(
            "propertyPrice, downPayment, annualInterestRate, and amortizationPeriod must be numbers"
          );
        done();
      });
  });

  // Test input range
  it("should return 400 for incorrect input range", (done) => {
    request(app)
      .post("/api/calculate-mortgage")
      .send({
        propertyPrice: 300000,
        downPayment: 300001,
        annualInterestRate: 5,
        amortizationPeriod: 25,
        paymentSchedule: "monthly",
      })
      .expect(400) // Check status code
      .expect("Content-Type", /json/) // Ensure response is JSON
      .end((err, res) => {
        if (err) return done(err); // Handle errors
        expect(res.body)
          .to.have.property("error")
          .eql("downPayment must be less than or equal to propertyPrice");
        done();
      });
  });

  // Test allowed values for paymentSchedule
  it("should return 400 for unallowed payment schedule value", (done) => {
    request(app)
      .post("/api/calculate-mortgage")
      .send({
        propertyPrice: 300000,
        downPayment: 40000,
        annualInterestRate: 5,
        amortizationPeriod: 25,
        paymentSchedule: "weekly",
      })
      .expect(400) // Check status code
      .expect("Content-Type", /json/) // Ensure response is JSON
      .end((err, res) => {
        if (err) return done(err); // Handle errors
        expect(res.body)
          .to.have.property("error")
          .eql(
            "Invalid paymentSchedule. Allowed values are monthly, bi-weekly, accelerated bi-weekly"
          );
        done();
      });
  });

  // Test maximum amortization period on a CMHC insured mortgage to be 25 years
  it("should return 400 for incorrect amortization period", (done) => {
    request(app)
      .post("/api/calculate-mortgage")
      .send({
        propertyPrice: 300000,
        downPayment: 40000,
        annualInterestRate: 5,
        amortizationPeriod: 30,
        paymentSchedule: "bi-weekly",
      })
      .expect(400) // Check status code
      .expect("Content-Type", /json/) // Ensure response is JSON
      .end((err, res) => {
        if (err) return done(err); // Handle errors
        expect(res.body)
          .to.have.property("error")
          .eql(
            "The maximum amortization period on a CMHC insured mortgage is 25 years"
          );
        done();
      });
  });

  // Test amortization period to be [5, 10, 15, 20, 25, 30]
  it("should return 400 for incorrect amortization period increments", (done) => {
    request(app)
      .post("/api/calculate-mortgage")
      .send({
        propertyPrice: 300000,
        downPayment: 40000,
        annualInterestRate: 5,
        amortizationPeriod: 23,
        paymentSchedule: "bi-weekly",
      })
      .expect(400) // Check status code
      .expect("Content-Type", /json/) // Ensure response is JSON
      .end((err, res) => {
        if (err) return done(err); // Handle errors
        expect(res.body)
          .to.have.property("error")
          .eql(
            "amortizationPeriod must be one of the following values: 5, 10, 15, 20, 25, 30 years"
          );
        done();
      });
  });

  // Test for invalid down payment (homes priced less than or equal to $500K)
  it("should return 400 when down payment is less than required", (done) => {
    request(app)
      .post("/api/calculate-mortgage")
      .send({
        propertyPrice: 300000,
        downPayment: 14900, // Less than the required minimum down payment
        annualInterestRate: 3.5,
        amortizationPeriod: 25,
        paymentSchedule: "monthly",
      })
      .expect(400) // Check status code
      .expect("Content-Type", /json/) // Ensure response is JSON
      .end((err, res) => {
        if (err) return done(err); // Handle errors
        expect(res.body)
          .to.have.property("error")
          .eql("The minimum down payment should be 5%");
        done();
      });
  });

  // Test for invalid down payment (homes priced between $500K and $1 million)
  it("should return 400 when down payment is less than required", (done) => {
    request(app)
      .post("/api/calculate-mortgage")
      .send({
        propertyPrice: 700000,
        downPayment: 20000, // Less than the required minimum down payment
        annualInterestRate: 3.5,
        amortizationPeriod: 25,
        paymentSchedule: "monthly",
      })
      .expect(400) // Check status code
      .expect("Content-Type", /json/) // Ensure response is JSON
      .end((err, res) => {
        if (err) return done(err); // Handle errors
        expect(res.body)
          .to.have.property("error")
          .eql(
            "For homes priced between $500K and $1 million, the down payment must be at least 5% of the first $500K and 10% of the amount over $500K"
          );
        done();
      });
  });

  // Test for invalid down payment (homes priced larger or equal to $1M)
  it("should return 400 when down payment is less than required", (done) => {
    request(app)
      .post("/api/calculate-mortgage")
      .send({
        propertyPrice: 1200000,
        downPayment: 239000, // Less than the required minimum down payment
        annualInterestRate: 3.5,
        amortizationPeriod: 25,
        paymentSchedule: "monthly",
      })
      .expect(400) // Check status code
      .expect("Content-Type", /json/) // Ensure response is JSON
      .end((err, res) => {
        if (err) return done(err); // Handle errors
        expect(res.body)
          .to.have.property("error")
          .eql(
            "For property price more than $1 million, please put more than 20% down"
          );
        done();
      });
  });

  // Test for invalid payment schedule
  it("should return 400 for invalid payment schedule", (done) => {
    request(app)
      .post("/api/calculate-mortgage")
      .send({
        propertyPrice: 600000,
        downPayment: 100000,
        annualInterestRate: 3.5,
        amortizationPeriod: 25,
        paymentSchedule: "weekly", // Invalid schedule
      })
      .expect(400) // Check status code
      .expect("Content-Type", /json/) // Ensure response is JSON
      .end((err, res) => {
        if (err) return done(err); // Handle errors
        expect(res.body)
          .to.have.property("error")
          .eql(
            "Invalid paymentSchedule. Allowed values are monthly, bi-weekly, accelerated bi-weekly"
          );
        done();
      });
  });
});
