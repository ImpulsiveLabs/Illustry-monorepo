import validator from 'validator';
import { DashboardTypes, VisualizationTypes } from '@illustry/types';
import { normalizeEmail } from '../auth/validation';

type SharePermission = DashboardTypes.DashboardSharePermission | VisualizationTypes.VisualizationSharePermission;
type ShareCollaborator = {
  email: string;
  permission?: SharePermission;
}

const normalizeShareCollaborators = <TPermission extends SharePermission>(
  collaborators: ShareCollaborator[],
  ownerEmail: string | undefined,
  resourceName: 'dashboard' | 'visualization'
): Array<{ email: string; permission: TPermission }> => {
  const ownerEmailNormalized = ownerEmail ? normalizeEmail(ownerEmail) : undefined;
  const unique = new Map<string, TPermission>();

  collaborators.forEach((collaborator) => {
    const email = normalizeEmail(collaborator.email || '');
    if (!validator.isEmail(email)) {
      throw new Error(`Invalid email address: ${collaborator.email}`);
    }
    if (ownerEmailNormalized && email === ownerEmailNormalized) {
      throw new Error(`You cannot share a ${resourceName} with yourself`);
    }
    unique.set(email, 'viewer' as TPermission);
  });

  if (unique.size === 0) {
    throw new Error('At least one collaborator is required');
  }

  return Array.from(unique.entries()).map(([email, permission]) => ({ email, permission }));
};

export { normalizeShareCollaborators };
