const deniedEl = document.getElementById("admin-denied");
const contentEl = document.getElementById("admin-users-content");
const statusEl = document.getElementById("admin-users-status");

let allUsers = [];

auth.onAuthStateChanged(async (user) => {
  if (!user) {
    statusEl.hidden = true;
    deniedEl.hidden = false;
    return;
  }

  try {
    const adminDoc = await db.collection("admins").doc(user.uid).get();
    if (!adminDoc.exists) {
      statusEl.hidden = true;
      deniedEl.hidden = false;
      return;
    }
    loadUsers();
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Couldn't verify admin permissions.";
  }
});

async function loadUsers() {
  statusEl.textContent = "Loading users...";

  try {
    const snapshot = await db.collection("users").get();
    allUsers = snapshot.docs.map((doc) => ({ uid: doc.id, ...doc.data() }));

    // Alphabetical by username so the list is predictable to scan.
    allUsers.sort((a, b) =>
      (a.username || "").localeCompare(b.username || "", undefined, { sensitivity: "base" })
    );

    document.getElementById("user-count").textContent =
      `${allUsers.length} registered ${allUsers.length === 1 ? "user" : "users"}`;

    renderUsers(allUsers);
    statusEl.hidden = true;
    contentEl.hidden = false;
  } catch (err) {
    console.error(err);
    statusEl.textContent =
      "Couldn't load users. The Firestore rules may need to allow admins to list the users collection -- see firestore.rules.";
  }
}

function renderUsers(users) {
  const listEl = document.getElementById("users-list");

  if (users.length === 0) {
    listEl.innerHTML = '<p class="users-empty">No users match that search.</p>';
    return;
  }

  listEl.innerHTML = users
    .map((u) => {
      const joined =
        u.createdAt && u.createdAt.toDate ? u.createdAt.toDate().toLocaleDateString() : "\u2014";
      const suspended = u.suspended === true;

      return `
      <a class="user-card ${suspended ? "is-suspended" : ""}" href="profile.html?uid=${encodeURIComponent(u.uid)}">
        <span class="user-card-main">
          <span class="user-card-name">${escapeHtml(u.username || "(no username)")}</span>
          <span class="user-card-email">${escapeHtml(u.email || "\u2014")}</span>
        </span>
        <span class="user-card-meta">
          ${suspended ? '<span class="suspended-tag">Suspended</span>' : ""}
          <span class="user-card-joined">Joined ${joined}</span>
        </span>
      </a>
    `;
    })
    .join("");
}

document.getElementById("user-search").addEventListener("input", (e) => {
  const query = e.target.value.trim().toLowerCase();

  if (!query) {
    renderUsers(allUsers);
    return;
  }

  const filtered = allUsers.filter(
    (u) =>
      (u.username || "").toLowerCase().includes(query) ||
      (u.email || "").toLowerCase().includes(query)
  );

  renderUsers(filtered);
});

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
