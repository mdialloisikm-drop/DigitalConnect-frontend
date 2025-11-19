import {User} from "./user";

/**
 * Interface représentant une pièce jointe ou un livrable
 */
export interface Attachement {
  id: number;
  attachable_type: string;
  attachable_id: number;
  uploaded_by: User;
  file_type: AttachmentType;
  file_name: string;
  file_path: string | null;
  url: string | null;
  format: AttachmentFormat;
  created_at: string;
  updated_at: string;
}

/**
 * Types de fichiers joints
 */
export type AttachmentType = 'attachment' | 'deliverable';

/**
 * Formats de fichiers joints
 */
export type AttachmentFormat = 'file' | 'link';
