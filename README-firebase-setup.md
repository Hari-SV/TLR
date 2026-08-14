# Setting Up the Support/Feedback System

## 1. Create a Firebase project
1. Go to https://console.firebase.google.com and create a project (the free Spark plan works fine).
2. In the project, click **Build > Firestore Database** → Create database → start in **production mode**.
3. Click **Build > Authentication** → Sign-in method → enable **Email/Password**.
4. Click the gear icon → **Project settings** → scroll to "Your apps" → click the **</> (Web)** icon to register a web app.
5. Copy the `firebaseConfig` object it gives you into `firebase-config.js`, replacing the placeholder values.

## 2. Apply the security rules
1. In Firestore, go to the **Rules** tab.
2. Paste in the contents of `firestore.rules` (included in this project) and click **Publish**.

This ensures:
- Anyone can submit a bug report/feedback (no login required).
- Only admins can read, edit, or delete reports.

## 3. Create your admin account
1. Go to **Authentication > Users > Add user**, enter your email + a password.
2. Copy that user's **UID** (shown in the users list).
3. Go to **Firestore Database > Start collection** → name it `admins`.
4. Add a document whose **Document ID is that UID** (any single field inside is fine, e.g. `role: "admin"`).

Now when you log in on the site with that email/password via the "Admin" button, you'll see the admin panel with all submitted reports.

## 4. Adding more admins later
Repeat step 3 for each additional admin's UID — there's no client-side signup for admins by design, so this always has to be done from the Firebase console.

## Notes
- Reports are visible live — new submissions appear in the admin panel automatically without refreshing.
- Admins can mark reports read/unread and delete them.
- If you outgrow the Spark (free) plan's limits, Firebase's pricing scales with usage — unlikely to matter unless you get a lot of traffic.
