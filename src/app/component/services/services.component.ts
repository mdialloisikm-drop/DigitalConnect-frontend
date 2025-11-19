import {Component, OnInit} from '@angular/core';
import {Service} from "../../models/service";
import {Category} from "../../models/category";
import {ApiService} from "../../services/api.service";

@Component({
  selector: 'app-services',
  templateUrl: './services.component.html',
  styleUrl: './services.component.css'
})
export class ServicesComponent implements OnInit{
  services: Service[] = [];
  filteredServices: Service[] = [];
  categories: Category[] = [];
  loading = true;

  searchTerm = '';
  selectedCategory = '';
  minPrice = '';
  maxPrice = '';

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading = true;

    this.apiService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (error) => console.error('Error loading categories:', error)
    });

    this.apiService.getServices().subscribe({
      next: (services) => {
        this.services = services.filter(s => s.status === 'published');
        this.filteredServices = this.services;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading services:', error);
        this.loading = false;
      }
    });
  }

  applyFilters() {
    this.filteredServices = this.services.filter(service => {
      const matchesSearch = service.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        service.description.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesCategory = !this.selectedCategory || service.categorie_id.toString() === this.selectedCategory;

      let matchesPrice = true;
      if (this.minPrice) {
        matchesPrice = matchesPrice && service.price >= parseFloat(this.minPrice);
      }
      if (this.maxPrice) {
        matchesPrice = matchesPrice && service.price <= parseFloat(this.maxPrice);
      }

      return matchesSearch && matchesCategory && matchesPrice;
    });
  }

  getImageUrl(path: string): string {
    return `http://localhost:8000/storage/${path}`;
  }

  getAvatarUrl(avatar: string): string {
    if (!avatar) {
      console.log('No avatar provided');
      return '';
    }

    // Construire l'URL complète
    const fullUrl = `http://localhost:8000/storage/avatars/${avatar}`;
    console.log('Avatar URL constructed:', fullUrl);
    return fullUrl;
  }
}
