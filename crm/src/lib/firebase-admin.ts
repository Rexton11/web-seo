import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Since we are in AI Studio, the admin SDK typically uses Application Default Credentials
// or we bypass verification if in dev. But Firebase verifies ID tokens.
// For the user's aaPanel, they will need a service account.
// Let's initialize without credentials and let it pick up GOOGLE_APPLICATION_CREDENTIALS,
// or provide a placeholder for them.

let firebaseAdminApp;
if (!getApps().length) {
  try {
    // If they have FIREBASE_PROJECT_ID, use it, else let it fail gracefully
    firebaseAdminApp = initializeApp({
      projectId: 'gen-lang-client-0451543162'
    });
  } catch (e) {
    console.error("Firebase admin init failed", e);
  }
} else {
  firebaseAdminApp = getApps()[0];
}

export const app = firebaseAdminApp;
