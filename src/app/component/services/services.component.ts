import { Component, OnInit } from '@angular/core';
import { Service } from '../../models/service';
import { Category } from '../../models/category';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-services',
  templateUrl: './services.component.html',
  styleUrl: './services.component.css'
})
export class ServicesComponent implements OnInit {
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
    this. loadData();
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
        this.services = services. filter(s => s.status === 'published');
        this.filteredServices = this.services;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading services:', error);
        this. loading = false;
      }
    });
  }

  applyFilters() {
    this.filteredServices = this.services.filter(service => {
      const matchesSearch = service.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        service.description.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesCategory = ! this.selectedCategory || service.categorie_id. toString() === this.selectedCategory;

      // ✅ CORRECTION : Utiliser getMinPrice() pour le filtre de prix
      let matchesPrice = true;
      const serviceMinPrice = this.getMinPrice(service);
      if (this.minPrice) {
        matchesPrice = matchesPrice && serviceMinPrice >= parseFloat(this.minPrice);
      }
      if (this.maxPrice) {
        matchesPrice = matchesPrice && serviceMinPrice <= parseFloat(this.maxPrice);
      }

      return matchesSearch && matchesCategory && matchesPrice;
    });
  }

  /**
   * Réinitialiser les filtres
   */
  resetFilters(): void {
    this.searchTerm = '';
    this.selectedCategory = '';
    this.minPrice = '';
    this.maxPrice = '';
    this.filteredServices = [... this.services];
  }

  getImageUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `http://localhost:8000/storage/${path}`;
  }

  getAvatarUrl(avatar: string): string {
    if (! avatar) return '';
    if (avatar.startsWith('http')) return avatar;
    return `http://localhost:8000/storage/avatars/${avatar}`;
  }

  // ==================== MÉTHODES HELPER POUR LES OFFRES ====================

  /**
   * Prix minimum (offre Starter généralement)
   */
  getMinPrice(service: Service): number {
    if (service.offers && service.offers. length > 0) {
      return Math.min(...service.offers.map(o => o.price));
    }
    return 0;
  }

  /**
   * Prix maximum (offre Advanced généralement)
   */
  getMaxPrice(service: Service): number {
    if (service.offers && service.offers.length > 0) {
      return Math. max(...service.offers.map(o => o.price));
    }
    return 0;
  }

  /**
   * Délai minimum (offre la plus rapide)
   */
  getMinDeliveryDays(service: Service): number {
    if (service.offers && service.offers.length > 0) {
      return Math.min(...service. offers.map(o => o. delivery_days));
    }
    return 0;
  }

  /**
   * Délai maximum
   */
  getMaxDeliveryDays(service: Service): number {
    if (service. offers && service.offers.length > 0) {
      return Math.max(...service.offers.map(o => o.delivery_days));
    }
    return 0;
  }

  /**
   * Nombre max de révisions
   */
  getMaxRevisions(service: Service): number {
    if (service.offers && service.offers.length > 0) {
      return Math. max(...service.offers.map(o => o.number_of_revisions));
    }
    return 0;
  }

  /**
   * Formate les révisions pour l'affichage
   */
  formatRevisions(service: Service): string {
    const max = this.getMaxRevisions(service);
    if (max === 0) {
      return 'Illimitées';
    }
    return `${max} révision${max > 1 ? 's' : ''}`;
  }

  /**
   * Formate le prix pour l'affichage (plage de prix si plusieurs offres)
   */
  formatPriceRange(service: Service): string {
    const min = this.getMinPrice(service);
    const max = this. getMaxPrice(service);

    if (min === max || max === 0) {
      return `$${min. toLocaleString('fr-FR')}`;
    }
    return `$${min.toLocaleString('fr-FR')} - $${max.toLocaleString('fr-FR')}`;
  }
}
