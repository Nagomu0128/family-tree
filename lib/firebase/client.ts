import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { firebaseConfig, assertFirebaseConfig } from './config'

function ensureApp(): FirebaseApp {
  if (getApps().length > 0) return getApp()
  assertFirebaseConfig()
  return initializeApp(firebaseConfig)
}

let _auth: Auth | undefined
let _db: Firestore | undefined

export function getFirebaseAuth(): Auth {
  if (!_auth) _auth = getAuth(ensureApp())
  return _auth
}

export function getDb(): Firestore {
  if (!_db) _db = getFirestore(ensureApp())
  return _db
}

export const googleProvider = new GoogleAuthProvider()
