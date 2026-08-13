const signupForm = document.getElementById("signup-form");

if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("signup-username").value.trim();
    const usernameKey = username.toLowerCase();
    const email = document.getElementById("signup-email").value.trim();
    const password = document.getElementById("signup-password").value;
    const passwordConfirm = document.getElementById("signup-password-confirm").value;
    const statusEl = document.getElementById("signup-status");
    const btn = document.getElementById("signup-submit-btn");

    statusEl.className = "form-status";

    if (!/^[A-Za-z0-9_]+$/.test(username)) {
      statusEl.textContent = "Username can only contain letters, numbers, and underscores.";
      statusEl.className = "form-status error";
      return;
    }

    if (password !== passwordConfirm) {
      statusEl.textContent = "Passwords do not match.";
      statusEl.className = "form-status error";
      return;
    }

    btn.disabled = true;
    statusEl.textContent = "Checking username availability...";

    try {

      const existing = await db.collection("usernames").doc(usernameKey).get();
      if (existing.exists) {
        statusEl.textContent = "That username is already taken.";
        statusEl.className = "form-status error";
        btn.disabled = false;
        return;
      }

      statusEl.textContent = "Creating your account...";


      //    password itself -- we never see or persist it ourselves.
      const cred = await auth.createUserWithEmailAndPassword(email, password);


      await cred.user.updateProfile({ displayName: username });

  
      const batch = db.batch();
      batch.set(db.collection("users").doc(cred.user.uid), {
        username,
        email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      batch.set(db.collection("usernames").doc(usernameKey), {
        uid: cred.user.uid,
      });

      try {
        await batch.commit();
      } catch (batchErr) {

        await cred.user.delete().catch(() => {});
        throw { code: "username/taken" };
      }

      statusEl.textContent = "Account created! Redirecting...";
      statusEl.className = "form-status success";
      setTimeout(() => (window.location.href = "index.html"), 1000);
    } catch (err) {
      console.error(err);
      statusEl.textContent =
        err.code === "username/taken"
          ? "That username was just taken -- please pick another."
          : friendlyAuthError(err);
      statusEl.className = "form-status error";
      btn.disabled = false;
    }
  });
}



const loginForm = document.getElementById("login-form");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;
    const statusEl = document.getElementById("login-status");
    const btn = document.getElementById("login-submit-btn");

    statusEl.className = "form-status";
    btn.disabled = true;
    statusEl.textContent = "Signing in...";

    try {
      await auth.signInWithEmailAndPassword(email, password);
      statusEl.textContent = "Welcome back! Redirecting...";
      statusEl.className = "form-status success";
      setTimeout(() => (window.location.href = "index.html"), 800);
    } catch (err) {
      console.error(err);
      statusEl.textContent = friendlyAuthError(err);
      statusEl.className = "form-status error";
      btn.disabled = false;
    }
  });
}



function friendlyAuthError(err) {
  switch (err.code) {
    case "auth/email-already-in-use":
      return "That email is already registered. Try logging in instead.";
    case "auth/invalid-email":
      return "That email address doesn't look right.";
    case "auth/weak-password":
      return "Password is too weak — use at least 6 characters.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Incorrect email or password.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    default:
      return "Something went wrong. Please try again.";
  }
}

// If already logged in and visiting login/signup directly, bounce home.
if (typeof auth !== "undefined") {
  auth.onAuthStateChanged((user) => {
    const onAuthPage = document.getElementById("signup-form") || document.getElementById("login-form");
    if (user && onAuthPage) {
      window.location.href = "index.html";
    }
  });
}
