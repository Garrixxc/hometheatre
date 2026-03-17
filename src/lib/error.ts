import { auth } from '../firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const originalMessage = error instanceof Error ? error.message : String(error);
  
  const errInfo: FirestoreErrorInfo = {
    error: originalMessage,
    operationType,
    path,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
  };

  let specificMessage = `Firestore ${operationType} failed on path: ${path || 'unknown'}.`;
  
  if (originalMessage.includes('permission-denied') || originalMessage.includes('insufficient permissions')) {
    specificMessage = `Security Rules Error: You do not have permission to ${operationType} at ${path || 'this location'}. Please check your firestore.rules.`;
  } else if (originalMessage.includes('not-found')) {
    specificMessage = `Data Error: The document at ${path || 'this location'} was not found.`;
  } else if (originalMessage.includes('quota-exceeded')) {
    specificMessage = `Quota Error: Firestore free tier limit reached. Quota will reset tomorrow.`;
  } else if (originalMessage.includes('offline')) {
    specificMessage = `Network Error: The client is offline. Please check your internet connection and Firebase configuration.`;
  }

  console.group(`🔥 Firestore Error: ${operationType.toUpperCase()}`);
  console.error(`Path: ${path || 'Unknown'}`);
  console.error(`Message: ${originalMessage}`);
  console.error(`Specific Info: ${specificMessage}`);
  console.groupEnd();
  
  throw new Error(JSON.stringify(errInfo));
}
