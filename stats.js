

async function loadLeaderboard() {
  const statusEl = document.getElementById("stats-status");
  const table = document.getElementById("stats-table");
  const tbody = document.getElementById("stats-tbody");

  try {

    const snapshot = await db
      .collectionGroup("gameSessions")
      .where("completed", "==", true)
      .get();

    if (snapshot.empty) {
      statusEl.textContent = "No completed runs yet -- be the first to finish the realm!";
      return;
    }


    const bestByUid = new Map();
    snapshot.forEach((doc) => {
      const uid = doc.ref.parent.parent.id; 
      const duration = doc.data().durationSeconds;
      if (!bestByUid.has(uid) || duration < bestByUid.get(uid)) {
        bestByUid.set(uid, duration);
      }
    });

    const uids = Array.from(bestByUid.keys());
    const usernameByUid = await resolveUsernames(uids);

    const rows = uids.map((uid) => ({
      username: usernameByUid.get(uid) || `Player-${uid.slice(0, 6)}`,
      durationSeconds: bestByUid.get(uid),
    }));

    rows.sort((a, b) => a.durationSeconds - b.durationSeconds);

    tbody.innerHTML = rows
      .map((row, index) => {
        const place = index + 1;
        const tier = place === 1 ? "gold" : place === 2 ? "silver" : place === 3 ? "bronze" : "";
        const rowClass = tier ? `rank-row-${tier}` : "";
        const badge = tier
          ? `<span class="rank-badge rank-badge-${tier}">${place}</span>`
          : `<span class="rank-plain">#${place}</span>`;

        return `
        <tr class="${rowClass}">
          <td class="rank-cell">${badge}</td>
          <td>${escapeHtml(row.username)}</td>
          <td>${formatDuration(row.durationSeconds)}</td>
        </tr>
      `;
      })
      .join("");

    statusEl.hidden = true;
    table.hidden = false;
  } catch (err) {
    console.error(err);
    statusEl.textContent = describeLeaderboardError(err);
  }
}

// Firestore 'in' queries are capped, so resolve usernames in safe chunks.
async function resolveUsernames(uids) {
  const usernameByUid = new Map();
  const chunkSize = 10;

  for (let i = 0; i < uids.length; i += chunkSize) {
    const chunk = uids.slice(i, i + chunkSize);
    const snap = await db.collection("usernames").where("uid", "in", chunk).get();
    snap.forEach((doc) => usernameByUid.set(doc.data().uid, doc.id));
  }

  return usernameByUid;
}


function describeLeaderboardError(err) {
  const message = err && err.message ? err.message : "";


  if (err && err.code === "failed-precondition" && /index/i.test(message)) {
    const linkMatch = message.match(/https:\/\/\S+/);
    return linkMatch
      ? `This query needs a Firestore index that hasn't been created yet. Create it here, then reload this page: ${linkMatch[0]}`
      : "This query needs a Firestore index that hasn't been created yet -- check the browser console for a link to create it.";
  }

  if (err && err.code === "permission-denied") {
    return "Couldn't load the leaderboard -- the Firestore rules aren't allowing this read yet. See firestore.rules / LEADERBOARD-TROUBLESHOOTING.md.";
  }

  return "Couldn't load the leaderboard. Check the browser console for the specific error.";
}

function formatDuration(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = (totalSeconds % 60).toFixed(2);
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

loadLeaderboard();
