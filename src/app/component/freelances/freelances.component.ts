import {Component, OnDestroy, OnInit} from '@angular/core';
import {Subject, takeUntil} from "rxjs";
import {Freelance} from "../../models/freelance";
import {
  AvailableFilters,
  FreelanceFilters,
  FreelanceProfile,
  FreelanceProfileService, PaginatedFreelances
} from "../../services/freelance-profile.service";
import {debounceTime, distinctUntilChanged} from "rxjs/operators";

@Component({
  selector: 'app-freelances',
  templateUrl: './freelances.component.html',
  styleUrl: './freelances.component.css'
})
export class FreelancesComponent implements OnInit, OnDestroy {
  // Données
  freelances: Freelance[] = [];
  availableFilters: AvailableFilters | null = null;
  selectedFreelance: FreelanceProfile | null = null;

  // État
  loading = false;
  showModal = false;
  showFilters = false;

  // Pagination
  currentPage = 1;
  lastPage = 1;
  perPage = 10;
  total = 0;

  // Filtres
  filters: FreelanceFilters = {
    min_rate: undefined,
    max_rate: undefined,
    skills: [],
    city: '',
    country: '',
    availability: undefined,
    min_experience: undefined,
    order_by: 'hourly_rate',
    order_direction: 'asc'
  };

  // Recherche
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(private freelanceProfileService: FreelanceProfileService) {}

  ngOnInit(): void {
    this.loadAvailableFilters();
    this.loadFreelances();
    this.setupSearch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Charger les filtres disponibles
   */
  loadAvailableFilters(): void {
    this.freelanceProfileService.getAvailableFilters()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (filters) => {
          this.availableFilters = filters;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des filtres:', error);
        }
      });
  }

  /**
   * Charger les freelances
   */
  loadFreelances(): void {
    this.loading = true;
    this.freelanceProfileService.getFreelances(this.filters, this.currentPage, this.perPage)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: PaginatedFreelances) => {
          this.freelances = response.data;
          this.currentPage = response.current_page;
          this.lastPage = response.last_page;
          this.perPage = response.per_page;
          this.total = response.total;
          this.loading = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des freelances:', error);
          this.loading = false;
        }
      });
  }

  /**
   * Configuration de la recherche avec debounce
   */
  setupSearch(): void {
    this.searchSubject
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((term: string) => {
        this.filters.city = term;
        this.currentPage = 1;
        this.loadFreelances();
      });
  }

  /**
   * Recherche de ville
   */
  onSearchCity(term: string): void {
    this.searchSubject.next(term);
  }

  /**
   * Toggle compétence
   */
  toggleSkill(skillId: number): void {
    if (!this.filters.skills) {
      this.filters.skills = [];
    }

    const index = this.filters.skills.indexOf(skillId);
    if (index > -1) {
      this.filters.skills.splice(index, 1);
    } else {
      this.filters.skills.push(skillId);
    }

    this.currentPage = 1;
    this.loadFreelances();
  }

  /**
   * Vérifier si une compétence est sélectionnée
   */
  isSkillSelected(skillId: number): boolean {
    return this.filters.skills?.includes(skillId) || false;
  }

  /**
   * Appliquer les filtres de taux horaire
   */
  applyRateFilter(): void {
    this.currentPage = 1;
    this.loadFreelances();
  }

  /**
   * Réinitialiser les filtres
   */
  resetFilters(): void {
    this.filters = {
      min_rate: undefined,
      max_rate: undefined,
      skills: [],
      city: '',
      country: '',
      availability: undefined,
      min_experience: undefined,
      order_by: 'hourly_rate',
      order_direction: 'asc'
    };
    this.currentPage = 1;
    this.loadFreelances();
  }

  /**
   * Ouvrir le modal de détails
   */
  openFreelanceModal(freelanceId: number): void {
    this.freelanceProfileService.getFreelanceProfile(freelanceId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (profile) => {
          this.selectedFreelance = profile;
          this.showModal = true;
          document.body.style.overflow = 'hidden';
        },
        error: (error) => {
          console.error('Erreur lors du chargement du profil:', error);
        }
      });
  }

  /**
   * Fermer le modal
   */
  closeModal(): void {
    this.showModal = false;
    this.selectedFreelance = null;
    document.body.style.overflow = 'auto';
  }

  /**
   * Toggle affichage des filtres (mobile)
   */
  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  /**
   * Changer de page
   */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.lastPage) {
      this.currentPage = page;
      this.loadFreelances();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /**
   * Pages visibles pour la pagination
   */
  get visiblePages(): number[] {
    const pages: number[] = [];
    const range = 2;

    for (let i = Math.max(1, this.currentPage - range); i <= Math.min(this.lastPage, this.currentPage + range); i++) {
      pages.push(i);
    }

    return pages;
  }

  /**
   * Générer les initiales du nom complet
   */
  getInitials(fullName: string): string {
    if (!fullName || fullName.trim() === '') {
      return 'U';
    }

    const names = fullName.trim().split(' ').filter(name => name.length > 0);

    if (names.length === 0) {
      return 'U';
    }

    if (names.length === 1) {
      return names[0].substring(0, 2).toUpperCase();
    }

    // Prendre la première lettre du prénom et du nom
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  }

  /**
   * Obtenir l'URL de l'avatar
   */
  getAvatarUrl(avatarPath: string | undefined, fullName?: string): string {
    if (!avatarPath) {
      const initials = this.getInitials(fullName || 'User');
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=4F46E5&color=fff&size=128&length=2`;
    }
    if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
      return avatarPath;
    }
    return `http://localhost:8000/storage/avatars/${avatarPath}`;
  }

  /**
   * Obtenir le libellé de disponibilité
   */
  getAvailabilityLabel(availability: string): string {
    return this.freelanceProfileService.getAvailabilityLabel(availability);
  }

  /**
   * Obtenir la classe CSS pour le badge de disponibilité
   */
  getAvailabilityClass(availability: string): string {
    return this.freelanceProfileService.getAvailabilityClass(availability);
  }

}
