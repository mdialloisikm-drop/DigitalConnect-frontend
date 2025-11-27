import { Service } from './service';
import { Order } from './order';
import { Proposal } from './proposal';
import { Contract } from './contract';

export interface FreelanceDashboardStats {
  // Services
  total_services: number;
  published_services: number;
  pending_services: number;
  archived_services: number;

  // Commandes
  total_orders: number;
  active_orders: number;
  completed_orders: number;
  delivered_orders: number;
  cancelled_orders: number;

  // Propositions
  total_proposals: number;
  pending_proposals: number;
  accepted_proposals: number;
  rejected_proposals: number;

  // Contrats
  total_contracts: number;
  active_contracts: number;
  completed_contracts: number;

  // Gains
  total_earnings: number;
  pending_earnings: number;
}

export interface StatusBreakdown {
  count: number;
  total_amount?: number;
}

export interface StatusBreakdownMap {
  [key: string]: StatusBreakdown;
}

export interface MonthlyEarning {
  month: string;
  total_earnings: number;
  orders_count: number;
}

export interface FreelanceDashboardOverview {
  statistics: FreelanceDashboardStats;
  recent_services: Service[];
  recent_orders: Order[];
  recent_proposals: Proposal[];
  recent_contracts: Contract[];
  service_status_breakdown: StatusBreakdownMap;
  order_status_breakdown: StatusBreakdownMap;
  monthly_earnings: MonthlyEarning[];
}
