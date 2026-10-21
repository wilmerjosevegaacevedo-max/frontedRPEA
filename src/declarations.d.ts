declare module "firebase/app" {
  export function initializeApp(config: any): any;
  export function getApps(): any[];
  export function getApp(): any;
}

declare module "firebase/auth" {
  export interface User {
    uid: string;
    email: string | null;
    displayName: string | null;
    getIdToken(forceRefresh?: boolean): Promise<string>;
  }
  export function getAuth(app?: any): any;
  export function onAuthStateChanged(auth: any, callback: (user: User | null) => void): () => void;
  export function signInWithEmailAndPassword(auth: any, email: string, pass: string): Promise<any>;
}

declare module "firebase/firestore" {
  export interface Timestamp {
    seconds: number;
    nanoseconds: number;
    toDate(): Date;
    toMillis(): number;
  }
  export interface DocumentSnapshot {
    id: string;
    data(): any;
  }
  export interface QuerySnapshot {
    empty: boolean;
    docs: DocumentSnapshot[];
  }
  export function getFirestore(app?: any): any;
  export function collection(db: any, path: string, ...pathSegments: string[]): any;
  export function doc(db: any, path?: string, ...pathSegments: string[]): any;
  export function setDoc(reference: any, data: any, options?: any): Promise<void>;
  export function getDoc(reference: any): Promise<any>;
  export function getDocs(query: any): Promise<any>;
  export function query(collectionRef: any, ...queryConstraints: any[]): any;
  export function where(fieldPath: string, opStr: string, value: any): any;
  export function onSnapshot(reference: any, onNext: (snapshot: QuerySnapshot) => void, onError?: (error: any) => void): () => void;
  export function serverTimestamp(): any;
}

declare module "firebase/storage" {
  export function getStorage(app?: any): any;
  export function ref(storage: any, url?: string): any;
  export function uploadBytes(ref: any, data: any, metadata?: any): Promise<any>;
  export function getDownloadURL(ref: any): Promise<string>;
}
