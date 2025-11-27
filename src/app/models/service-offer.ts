import {Service} from "./service";

export interface ServiceOffer {
  id?: number;
  service_id?: number;
  title: 'Starter' | 'Standard' | 'Advanced';
  delivery_days: number;
  number_of_revisions: number;
  price: number;
  created_at?: string;
  updated_at?: string;
  service?: Service;
}
