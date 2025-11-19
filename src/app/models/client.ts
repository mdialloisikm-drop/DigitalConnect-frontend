import {User} from "./user";

export interface Client {
  id: number;
  user_id: number;
  company_name?: string;
  company_description?: string;
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface ClientDashboardStats {
  total_projects: number;
  active_projects: number;
  completed_projects: number;
  total_spent: number;
  total_proposals: number;
  pending_proposals: number;
  accepted_proposals: number;
  rejected_proposals: number;
}
