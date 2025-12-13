import {Component, OnInit} from '@angular/core';
import {Project} from "../../models/project";
import {Service} from "../../models/service";
import {ApiService} from "../../services/api.service";
import {Category} from "../../models/category";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit{
  recentProjects: Project[] = [];
  recentServices: Service[] = [];
  categories: Category[] = [];
  loading = true;

  // Données Statiques (Pour le design/marketing)
  activeFaq: number | null = null;

  faqs = [
    {
      question: "Comment fonctionne le système de paiement ?",
      answer: "Nous sécurisons les fonds dès le début de la mission. L'argent n'est versé au freelance qu'une fois que vous validez la réception du travail."
    },
    {
      question: "Y a-t-il des frais d'inscription ?",
      answer: "Non, l'inscription est totalement gratuite pour les clients et les freelances. Nous prenons une petite commission uniquement sur les projets réalisés."
    },
    {
      question: "Comment vérifier la qualité d'un freelance ?",
      answer: "Consultez les avis des précédents clients, le portfolio et le niveau d'expérience affiché sur chaque profil avant de vous engager."
    }
  ];

  testimonials = [
    { name: "Sarah L.", role: "CEO Start-up", text: "J'ai trouvé un développeur en 2 heures. Incroyable efficacité.", image: "https://randomuser.me/api/portraits/women/44.jpg" },
    { name: "Marc D.", role: "Freelance Senior", text: "Cette plateforme m'apporte des clients réguliers et sérieux.", image: "https://randomuser.me/api/portraits/men/32.jpg" }
  ];

  stats = [
    { value: "500+", label: "Projets réalisés" },
    { value: "98%", label: "Satisfaction" },
    { value: "24h", label: "Délai moyen" }
  ];

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading = true;


    this.apiService.getProjects().subscribe({
      next: (projects) => {
        this.recentProjects = projects.slice(0, 3);
        this.checkLoadingComplete();
      },
      error: (e) => { console.error('Error projects', e); this.checkLoadingComplete(); }
    });


    this.apiService.getServices().subscribe({
      next: (services) => {
        this.recentServices = services.slice(0, 3);
        this.checkLoadingComplete();
      },
      error: (e) => { console.error('Error services', e); this.checkLoadingComplete(); }
    });

    // 3. Charger les Catégories (Nouveau)
    this.apiService.getCategories().subscribe({
      next: (cats) => {
        this.categories = cats.slice(0, 6);
      },
      error: (e) => console.error('Error categories', e)
    });
  }


  checkLoadingComplete() {
    this.loading = false;
  }

  getImageUrl(path: string | undefined | null): string {
    if (!path) {
      return '';
    }
    if (path.startsWith('http')) {
      return path;
    }
    return `http://localhost:8000/storage/${path}`;
  }

  toggleFaq(index: number) {
    this.activeFaq = this.activeFaq === index ? null : index;
  }


  getCategoryIcon(categoryName: string): string {
    const name = categoryName.toLowerCase();
    if (name.includes('dev') || name.includes('web')) return 'fas fa-code';
    if (name.includes('design') || name.includes('graph')) return 'fas fa-paint-brush';
    if (name.includes('market')) return 'fas fa-bullhorn';
    if (name.includes('rédac') || name.includes('ecrit')) return 'fas fa-pen-nib';
    if (name.includes('vidéo') || name.includes('audio')) return 'fas fa-video';
    if (name.includes('business') || name.includes('conseil')) return 'fas fa-briefcase';
    return 'fas fa-layer-group';
  }

  /**
   * Prix minimum (offre Starter généralement)
   */
  getMinPrice(service: Service): number {
    if (service.offers && service.offers. length > 0) {
      return Math.min(...service.offers.map(o => o.price));
    }
    return 0;
  }

  formatBudget(budget: number | string | undefined): string {
    if (!budget) return 'À négocier';

    const numericBudget = typeof budget === 'number'
      ? budget
      : parseFloat(budget.toString().replace(/[^\d.]/g, ''));

    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numericBudget) + ' $';
  }
}
