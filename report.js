const supportForm = document.getElementById("support-form");
const supportStatus = document.getElementById("support-form-status");

supportForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const type = supportForm.querySelector('input[name="report-type"]:checked').value;
  const email = document.getElementById("report-email").value.trim();
  const message = document.getElementById("report-message").value.trim();
  const submitBtn = document.getElementById("report-submit-btn");

  if (!message) return;

  submitBtn.disabled = true;
  supportStatus.textContent = "Submitting...";
  supportStatus.className = "form-status";

  try {
    await db.collection("reports").add({
      type,
      email: email || null,
      message,
      status: "unread",
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      page: document.referrer || null,
    });

    supportStatus.textContent = "Thank you! Your message has been sent. Redirecting...";
    supportStatus.className = "form-status success";
    supportForm.reset();
    setTimeout(() => (window.location.href = "index.html"), 1500);
  } catch (err) {
    console.error(err);
    supportStatus.textContent = "Something went wrong. Please try again.";
    supportStatus.className = "form-status error";
    submitBtn.disabled = false;
  }
});
