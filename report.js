const guestEl = document.getElementById("report-guest");
const contentEl = document.getElementById("report-content");
const supportForm = document.getElementById("support-form");
const supportStatus = document.getElementById("support-form-status");

auth.onAuthStateChanged((user) => {
  if (!user) {
    contentEl.hidden = true;
    guestEl.hidden = false;
    return;
  }
  guestEl.hidden = true;
  contentEl.hidden = false;
  document.getElementById("report-email").value = user.email || "";
});

supportForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const user = auth.currentUser;
  if (!user) return; // shouldn't happen since the form is gated, but stay safe

  const type = supportForm.querySelector('input[name="report-type"]:checked').value;
  const message = document.getElementById("report-message").value.trim();
  const submitBtn = document.getElementById("report-submit-btn");

  if (!message) return;

  submitBtn.disabled = true;
  supportStatus.textContent = "Submitting...";
  supportStatus.className = "form-status";

  try {
    await db.collection("reports").add({
      type,
      email: user.email || null,
      uid: user.uid,
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
