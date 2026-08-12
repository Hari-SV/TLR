(function () {
  const sessionBar = document.getElementById("session-bar");
  const sessionLabel = document.getElementById("session-label");
  const logoutBtn = document.getElementById("session-logout-btn");
  const loginBtn = document.getElementById("login-btn");
  const signupBtn = document.getElementById("signup-btn");

  if (!sessionBar) return; // page doesn't have the bar

  function setVisible(el, visible) {
    if (!el) return;
    el.hidden = !visible;
    el.classList.toggle("is-hidden", !visible);
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => auth.signOut());
  }

  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      setVisible(sessionBar, false);
      setVisible(logoutBtn, false);
      setVisible(loginBtn, true);
      setVisible(signupBtn, true);
      return;
    }


    let name = user.displayName || user.email;
    sessionLabel.textContent = `Welcome, ${name}`;
    setVisible(sessionBar, true);
    setVisible(logoutBtn, true);
    setVisible(loginBtn, false);
    setVisible(signupBtn, false);

    try {
      const doc = await db.collection("users").doc(user.uid).get();
      if (doc.exists && doc.data().username) {
        sessionLabel.textContent = `Welcome, ${doc.data().username}`;
      }
    } catch (err) {
      // Non-fatal -- displayName/email fallback above already covers it.
      console.warn("Could not load username:", err);
    }
  });
})();
