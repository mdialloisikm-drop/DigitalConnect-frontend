import { Project } from './project';
import { Freelance } from './freelance';

/**
 * Statuts possibles d'une proposition
 */
export type ProposalStatus = 'pending' | 'accepted' | 'rejected';

/**
 * Interface pour les pièces jointes d'une proposition
 */
export interface ProposalAttachment {
  id: number;
  proposal_id: number;
  format: 'file' | 'link';
  file_path?: string;
  file_name?: string;
  file_size?: number;
  link?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Interface principale pour une proposition
 */
export interface Proposal {
  id: number;
  project_id: number;
  freelance_id: number;
  cover_letter: string;
  proposed_amount: number;
  proposed_duration: number;
  status: ProposalStatus;
  created_at: string;
  updated_at: string;
  project?: Project;
  freelance?: Freelance;
  attachments?: ProposalAttachment[];
}

/**
 * Interface pour la création/modification d'une proposition
 */
export interface ProposalFormData {
  project_id: number;
  cover_letter: string;
  proposed_amount: number;
  proposed_duration: number;
}

/**
 * Interface pour la réponse de l'API lors de la création/modification
 */
export interface ProposalResponse {
  message: string;
  proposal: Proposal;
}
