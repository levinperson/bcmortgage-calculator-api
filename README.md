# Mortgage Calculator API

## Description

A BC mortgage calculator API built using node.js. CMHC insurance has been considered.
Testing has been written and a user interface that communicates with the API is also included.

Input
● property price
● down payment
● annual interest rate
● amortization period (5 year increments between 5 and 30 years)
● payment schedule (accelerated bi-weekly, bi-weekly, monthly)

Expected Output
● payment per payment schedule
● an error if the inputs are not valid. This includes cases where the down payment is not
large enough.

## Installation

1. Clone the repository:

```bash
git clone https://github.com/levinperson/bcmortgage-calculator-api.git
```

2. Navigate to the project directory:

```bash
cd bcmortgage-calculator-api
```

3. Install dependencies:

```bash
npm install
```

## Usage

### Run the API Server

Ensure your API server is running by executing the following command under the project folder:

```bash
node index.js
```

Then, the API can be tested manually using Postman or Insomnia.

### API Endpoint

POST /api/calculate-mortgage

### Example Request:

```json
{
  "propertyPrice": 300000,
  "downPayment": 40000,
  "annualInterestRate": 5,
  "amortizationPeriod": 25,
  "paymentSchedule": "monthly"
}
```

### Example Response:

```json
{
  "paymentSchedule": "monthly",
  "paymentAmount": "1567.05"
}
```

## Running with a UI

Under the project folder, execute:

```bash
node index.js
```

Then, in your browser, go to http://localhost:3000 to interact with the API using the UI.

## Testing

To run tests with Mocha, execute the following command under the project folder:

```bash
npx mocha --timeout 5000 --exit
```
