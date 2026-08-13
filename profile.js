const ACHIEVEMENT_CATALOG = [
  { id: "tutorial_complete", label: "Tutorial Complete", blurb: "Finished the tutorial." },
  { id: "speedrun_bronze", label: "Speedrun: Bronze", blurb: "Cleared the realm within the bronze time." },
  { id: "speedrun_silver", label: "Speedrun: Silver", blurb: "Cleared the realm within the silver time." },
  { id: "speedrun_gold", label: "Speedrun: Gold", blurb: "Cleared the realm within the gold time." },
];

const guestEl = document.getElementById("profile-guest");
const contentEl = document.getElementById("profile-content");
const statusEl = document.getElementById("profile-status");
const adminBarEl = document.getElementById("admin-bar");

// ?uid=... means "an admin is viewing someone else's profile".
const requestedUid = new URLSearchParams(window.location.search).get("uid");

let viewingUid = null;
let viewerIsAdmin = false;

auth.onAuthStateChanged(async (user) => {
  if (!user) {
    statusEl.hidden = true;
    guestEl.hidden = false;
    return;
  }

  // Only check admin status when it actually matters (viewing someone else,
  // or needing the suspend controls on any profile).
  try {
    const adminDoc = await db.collection("admins").doc(user.uid).get();
    viewerIsAdmin = adminDoc.exists;
  } catch (err) {
    viewerIsAdmin = false;
  }

  if (requestedUid && requestedUid !== user.uid) {
    if (!viewerIsAdmin) {
      statusEl.textContent = "You don't have permission to view that profile.";
      return;
    }
    viewingUid = requestedUid;
  } else {
    viewingUid = user.uid;
  }

  loadProfile(viewingUid, user);
});

async function loadProfile(uid, viewer) {
  try {
    const [userDoc, sessionsSnap, achievementsSnap] = await Promise.all([
      db.collection("users").doc(uid).get(),
      db.collection("users").doc(uid).collection("gameSessions").get(),
      db.collection("users").doc(uid).collection("achievements").get(),
    ]);

    if (!userDoc.exists) {
      statusEl.textContent = "No profile found for that user.";
      return;
    }

    renderIdentity(uid, viewer, userDoc);
    renderStats(sessionsSnap);
    renderAchievements(achievementsSnap);

    if (viewerIsAdmin) {
      renderAdminBar(uid, userDoc);
    }

    statusEl.hidden = true;
    contentEl.hidden = false;
  } catch (err) {
    console.error(err);
    statusEl.textContent =
      "Couldn't load this profile. If you're an admin viewing another user, the Firestore rules may need updating -- see firestore.rules.";
  }
}

function renderIdentity(uid, viewer, userDoc) {
  const data = userDoc.data();
  const isSelf = uid === viewer.uid;

  const username = data.username || (isSelf ? viewer.displayName || viewer.email : "(no username)");
  document.getElementById("profile-username").textContent = username;

  const metaParts = [];
  if (data.email) metaParts.push(data.email);
  else if (isSelf && viewer.email) metaParts.push(viewer.email);
  if (data.createdAt && data.createdAt.toDate) {
    metaParts.push(`Member since ${data.createdAt.toDate().toLocaleDateString()}`);
  }
  document.getElementById("profile-meta").textContent = metaParts.join(" \u00b7 ");

  // Make it unmistakable when an admin is looking at someone else's profile.
  const viewingNotice = document.getElementById("viewing-notice");
  if (!isSelf) {
    viewingNotice.textContent = "Viewing as administrator";
    viewingNotice.hidden = false;
  } else {
    viewingNotice.hidden = true;
  }
}

function renderStats(sessionsSnap) {
  const sessions = sessionsSnap.docs.map((doc) => doc.data());
  const completedSessions = sessions.filter((s) => s.completed === true);

  const fastest = completedSessions.reduce(
    (min, s) => (min === null || s.durationSeconds < min ? s.durationSeconds : min),
    null
  );

  document.getElementById("stat-fastest").textContent =
    fastest === null ? "\u2014" : formatDuration(fastest);
  document.getElementById("stat-completed").textContent = completedSessions.length;
  document.getElementById("stat-attempts").textContent = sessions.length;
}

function renderAchievements(achievementsSnap) {
  const earned = new Map();
  achievementsSnap.forEach((doc) => earned.set(doc.id, doc.data()));

  const grid = document.getElementById("achievements-grid");
  grid.innerHTML = ACHIEVEMENT_CATALOG.map((entry) => {
    const data = earned.get(entry.id);
    const unlocked = Boolean(data);
    const dateStr =
      unlocked && data.unlockedAt && data.unlockedAt.toDate
        ? data.unlockedAt.toDate().toLocaleDateString()
        : "";

    return `
      <div class="achievement-card ${unlocked ? "is-unlocked" : "is-locked"}">
        <span class="achievement-icon">${unlocked ? "\u2726" : "\u2727"}</span>
        <span class="achievement-label">${entry.label}</span>
        <span class="achievement-blurb">${unlocked ? entry.blurb : "Not yet unlocked"}</span>
        ${unlocked ? `<span class="achievement-date">${dateStr}</span>` : ""}
      </div>
    `;
  }).join("");
}

function renderAdminBar(uid, userDoc) {
  const suspended = userDoc.data().suspended === true;

  adminBarEl.innerHTML = `
    <div class="admin-bar-inner">
      <span class="admin-bar-label">
        Admin controls &middot; Status:
        <strong class="${suspended ? "status-suspended" : "status-active"}">
          ${suspended ? "Suspended" : "Active"}
        </strong>
      </span>
      <button id="toggle-suspend-btn" class="${suspended ? "btn-ghost" : "btn-solid"}">
        ${suspended ? "Unsuspend User" : "Suspend User"}
      </button>
    </div>
    <p id="admin-bar-status" class="form-status"></p>
  `;
  adminBarEl.hidden = false;

  document.getElementById("toggle-suspend-btn").addEventListener("click", async () => {
    const confirmMsg = suspended
      ? "Unsuspend this user? They'll regain access to the site."
      : "Suspend this user? They'll be signed out and blocked from the site.";
    if (!confirm(confirmMsg)) return;

    const btn = document.getElementById("toggle-suspend-btn");
    const barStatus = document.getElementById("admin-bar-status");
    btn.disabled = true;
    barStatus.textContent = "Updating...";
    barStatus.className = "form-status";

    try {
      await db.collection("users").doc(uid).update({ suspended: !suspended });
      barStatus.textContent = suspended ? "User unsuspended." : "User suspended.";
      barStatus.className = "form-status success";
      setTimeout(() => window.location.reload(), 900);
    } catch (err) {
      console.error(err);
      barStatus.textContent =
        "Couldn't update. The Firestore rules may not allow admins to write this field yet.";
      barStatus.className = "form-status error";
      btn.disabled = false;
    }
  });
}

function formatDuration(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = (totalSeconds % 60).toFixed(2);
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}
