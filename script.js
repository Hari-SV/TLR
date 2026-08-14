// ============================================
// Mobile/tablet nav toggle
// ============================================

const navToggle = document.getElementById("nav-toggle");
const navMenu = document.getElementById("nav-menu");

if (navToggle && navMenu) {
  navToggle.addEventListener("click", () => {
    const isOpen = navMenu.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  // Close the menu after navigating (clicking any link inside it)
  navMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navMenu.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

// ============================================
// Existing placeholder buttons
// ============================================

document.querySelector(".play-btn").addEventListener("click", () => {
  window.location.href = "play.html";
});

// ============================================
// Admin Panel
// ============================================

const adminPanel = document.getElementById("admin-panel");
const adminLoginBtn = document.getElementById("admin-login-btn");

document.getElementById("admin-logout-btn").addEventListener("click", () => {
  auth.signOut();
});

// Watch auth state: if the signed-in user is a verified admin, show the panel.
// Admin verification/sign-in itself now happens on admin-login.html *before*
// redirecting here, so this only ever needs to show/hide the panel -- it
// never needs to sign anyone out.
auth.onAuthStateChanged(async (user) => {
  if (!user) {
    adminPanel.hidden = true;
    adminLoginBtn.hidden = false;
    return;
  }

  try {
    const adminDoc = await db.collection("admins").doc(user.uid).get();
    if (adminDoc.exists) {
      adminPanel.hidden = false;
      adminLoginBtn.hidden = true; // redundant once the panel is showing
      loadReports();
    } else {
      adminPanel.hidden = true;
      adminLoginBtn.hidden = false;
    }
  } catch (err) {
    console.error(err);
    adminPanel.hidden = true;
  }
});

// ============================================
// Admin Panel: load + render + filter reports
// ============================================

let allReports = [];
let currentFilter = "all";

function loadReports() {
  const listEl = document.getElementById("admin-reports-list");
  listEl.innerHTML = '<p class="admin-empty">Loading reports...</p>';

  db.collection("reports")
    .orderBy("createdAt", "desc")
    .onSnapshot(
      (snapshot) => {
        allReports = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        renderReports();
      },
      (err) => {
        console.error(err);
        listEl.innerHTML = '<p class="admin-empty">Could not load reports.</p>';
      }
    );
}

function renderReports() {
  const listEl = document.getElementById("admin-reports-list");

  let filtered = allReports;
  if (currentFilter === "bug") filtered = allReports.filter((r) => r.type === "bug");
  if (currentFilter === "feedback") filtered = allReports.filter((r) => r.type === "feedback");
  if (currentFilter === "unread") filtered = allReports.filter((r) => r.status !== "read");

  if (filtered.length === 0) {
    listEl.innerHTML = '<p class="admin-empty">No reports here yet.</p>';
    return;
  }

  listEl.innerHTML = filtered
    .map((r) => {
      const date = r.createdAt && r.createdAt.toDate ? r.createdAt.toDate().toLocaleString() : "Just now";
      const isRead = r.status === "read";
      return `
        <div class="report-card ${isRead ? "is-read" : ""}" data-id="${r.id}">
          <div class="report-card-top">
            <span class="report-tag ${r.type}">${r.type === "bug" ? "Bug" : "Feedback"}</span>
            <span class="report-meta">${date}${r.email ? ` &middot; ${escapeHtml(r.email)}` : ""}</span>
          </div>
          <p class="report-message">${escapeHtml(r.message)}</p>
          <div class="report-actions">
            <button class="toggle-read-btn" data-id="${r.id}" data-read="${isRead}">
              ${isRead ? "Mark Unread" : "Mark Read"}
            </button>
            <button class="delete-report-btn" data-id="${r.id}">Delete</button>
          </div>
        </div>
      `;
    })
    .join("");

  listEl.querySelectorAll(".toggle-read-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const isRead = btn.dataset.read === "true";
      await db.collection("reports").doc(id).update({ status: isRead ? "unread" : "read" });
    });
  });

  listEl.querySelectorAll(".delete-report-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("Delete this report permanently?")) return;
      await db.collection("reports").doc(btn.dataset.id).delete();
    });
  });
}

document.querySelectorAll(".filter-pill").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter-pill").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    renderReports();
  });
});

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
