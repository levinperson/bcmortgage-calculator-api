document
  .getElementById("mortgageForm")
  .addEventListener("submit", async function (event) {
    event.preventDefault();

    // Get form values
    const propertyPrice = parseFloat(
      document.getElementById("propertyPrice").value
    );
    const downPayment = parseFloat(
      document.getElementById("downPayment").value
    );
    const annualInterestRate = parseFloat(
      document.getElementById("annualInterestRate").value
    );
    const amortizationPeriod = parseInt(
      document.getElementById("amortizationPeriod").value,
      10
    );
    const paymentSchedule = document.getElementById("paymentSchedule").value;

    try {
      // Send a POST request to the API
      const response = await fetch(
        "http://localhost:3000/api/calculate-mortgage",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            propertyPrice,
            downPayment,
            annualInterestRate,
            amortizationPeriod,
            paymentSchedule,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const paymentAmount = parseFloat(data.paymentAmount);
        // Display the result
        document.getElementById(
          "paymentAmount"
        ).textContent = `$${paymentAmount.toFixed(2)}`;
      } else {
        // If the response is not OK, extract and display the error message
        const errorData = await response.json();
        document.getElementById("paymentAmount").textContent = `Error: ${
          errorData.error || "An error occurred. Please try again."
        }`;
      }
    } catch (error) {
      console.error("Error:", error);
      document.getElementById("paymentAmount").textContent =
        "An error occurred. Please try again.";
    }
  });
