import {ServiceImage} from "./service_image";
import {Category} from "./category";
import {Freelance} from "./freelance";

export interface Service {
  id: number;
  freelance_id: number;
  title: string;
  description: string;
  categorie_id: number;
  price: number;
  delivery_time: number;
  number_of_revisions: number;
  status: 'published' | 'archived';
  created_at: string;
  freelance?: Freelance;
  category?: Category;
  images?: ServiceImage[];
}
