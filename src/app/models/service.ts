import {ServiceImage} from "./service_image";
import {Category} from "./category";
import {Freelance} from "./freelance";
import {ServiceOffer} from "./service-offer";

export interface Service {
  id: number;
  freelance_id: number;
  title: string;
  description: string;
  categorie_id: number;
  price: number;
  status: 'published' | 'archived' | 'rejected';
  created_at: string;
  freelance: Freelance;
  category?: Category;
  images?: ServiceImage[];
  offers?: ServiceOffer[];
}
