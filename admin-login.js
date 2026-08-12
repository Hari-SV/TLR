const adminLoginForm = document.getElementById("admin-login-form");
const adminLoginStatus = document.getElementById("admin-login-status");

adminLoginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("admin-email").value.trim();
  const password = document.getElementById("admin-password").value;
  const submitBtn = adminLoginForm.querySelector('button[type="submit"]');

  adminLoginStatus.textContent = "Signing in...";
  adminLoginStatus.className = "form-status";
  submitBtn.disabled = true;

  try {
    const cred = await auth.signInWithEmailAndPassword(email, password);

    // Verify admin status *before* redirecting, so a non-admin account
    // never lands on index.html looking "signed in as admin".
    const adminDoc = await db.collection("admins").doc(cred.user.uid).get();

    if (adminDoc.exists) {
      adminLoginStatus.textContent = "Welcome back. Redirecting...";
      adminLoginStatus.className = "form-status success";
      setTimeout(() => (window.location.href = "index.html"), 700);
    } else {
      adminLoginStatus.textContent = "This account is not an admin.";
      adminLoginStatus.className = "form-status error";
      await auth.signOut();
      submitBtn.disabled = false;
    }
  } catch (err) {
    console.error(err);
    adminLoginStatus.textContent = "Sign in failed. Check your email/password.";
    adminLoginStatus.className = "form-status error";
    submitBtn.disabled = false;
  }
});
