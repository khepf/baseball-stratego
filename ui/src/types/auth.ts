import { User as FirebaseUser } from "firebase/auth";

export interface User {
  uid: string;
  email: string | null;
  username: string;
  displayName: string | null;
  photoURL: string | null;
}

export interface AuthContextType {
  currentUser: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signup: (email: string, password: string, username: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}
