import { Client } from './client';
import {Attachement} from "./attachement";
import {ServiceOffer} from "./service-offer";

export interface Order {
  id: number;
  service_offer_id: number;
  client_id: number;
  amount: number;
  due_date?: string;
  delivered_at?: string;
  requirements?: string;
  status: 'pending' | 'in_progress' | 'delivered' | 'completed' | 'cancelled' | 'revision';
  created_at: string;
  updated_at: string;
  client?: Client;
  service_offer?: ServiceOffer;
  deliverables?: Attachement[];
  attachments?: Attachement[];
}

export interface Deliverable {
  id: number;
  attachable_type: string;
  attachable_id: number;
  uploaded_by: number;
  file_type: string;
  file_name: string;
  file_path: string;
  format: string;
  created_at: string;
  updated_at: string;
}

export interface Attachment {
  id: number;
  attachable_type: string;
  attachable_id: number;
  uploaded_by: number;
  file_type: string;
  file_name: string;
  file_path: string;
  format: string;
  created_at: string;
  updated_at: string;
}

export interface OrderCreateRequest {
  service_offer_id: number;
  requirements?: string;
  attachments?: File[];
}

export interface OrderUpdateRequest {
  requirements?: string;
}

export interface RevisionRequest {
  revision_notes: string;
}

