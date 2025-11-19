import { Project } from './project';
import { Proposal } from './proposal';
import { Client } from './client';
import { Freelance } from './freelance';
import {User} from "./user";


/**
 * Types de statut d'un contrat
 */
export type ContractStatus = 'active' | 'completed' | 'cancelled' | 'disputed';


export interface Contract {
  id: number;
  project_id: number;
  proposal_id: number;
  client_id: number;
  freelance_id: number;
  amount: number;
  duration: number;
  start_date: string;
  end_date: string;
  terms?: string;
  status: 'active' | 'completed' | 'cancelled' | 'disputed';
  signed_at: string;
  created_at: string;
  updated_at: string;
  project: Project;
  proposal?: Proposal;
  client?: Client;
  freelance?: Freelance;
}



export interface ContractStatistics {
  total: number;
  active: number;
  completed: number;
  cancelled: number;
  disputed: number;
  total_amount: number;
  average_duration: number;
}


export interface ContractStatistics {
  total: number;
  active: number;
  completed: number;
  cancelled: number;
  disputed: number;
  total_amount: number;
  average_duration: number;
}







