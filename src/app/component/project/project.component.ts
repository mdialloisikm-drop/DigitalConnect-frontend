import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Project } from '../../models/project';
import { Category } from '../../models/category';
import { Skill } from '../../models/skill';
import { ApiService } from '../../services/api.service';

interface FilterState {
  searchTerm: string;
  selectedCategory: string;
  selectedSkills: number[];
  selectedStatus: string;
  minBudget: number;
  maxBudget: number;
}

interface ExpandedSections {
  competences: boolean;
  budget: boolean;
  categorie: boolean;
  statut: boolean;
}

@Component({
  selector: 'app-project',
  templateUrl: './project.component.html',
  styleUrl: './project.component.css'
})
export class ProjectComponent implements OnInit, OnDestroy {
  projects: Project[] = [];
  filteredProjects: Project[] = [];
  categories: Category[] = [];
  skills: Skill[] = [];
  loading = true;

  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();

  // État des filtres
  filters: FilterState = {
    searchTerm: '',
    selectedCategory: '',
    selectedSkills: [],
    selectedStatus: '',
    minBudget: 0,
    maxBudget: 50000
  };

  // Sections expandables
  expandedSections: ExpandedSections = {
    competences: true,
    budget: true,
    categorie: true,
    statut: true
  };

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.setupSearchDebounce();
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Configure le debounce pour la recherche
   */
  private setupSearchDebounce(): void {
    this.searchSubject$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((searchTerm: string) => {
        this.filters.searchTerm = searchTerm;
        this.applyFilters();
      });
  }

  /**
   * Charge toutes les données nécessaires
   */
  private loadData(): void {
    this.loading = true;

    // Charger les catégories
    this.apiService.getCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (categories: Category[]) => {
          this.categories = categories;
        },
        error: (error: Error) => {
          console.error('Erreur lors du chargement des catégories:', error);
        }
      });

    // Charger les compétences
    this.apiService.getSkills()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (skills: Skill[]) => {
          this.skills = skills;
        },
        error: (error: Error) => {
          console.error('Erreur lors du chargement des compétences:', error);
        }
      });

    // Charger les projets
    this.apiService.getProjects()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (projects: Project[]) => {
          this.projects = projects;
          this.filteredProjects = [...projects];
          this.loading = false;
        },
        error: (error: Error) => {
          console.error('Erreur lors du chargement des projets:', error);
          this.loading = false;
        }
      });
  }

  /**
   * Gère le changement de recherche avec debounce
   */
  onSearchChange(searchTerm: string): void {
    this.searchSubject$.next(searchTerm);
  }

  /**
   * Toggle une section du filtre
   */
  toggleSection(section: keyof ExpandedSections): void {
    this.expandedSections[section] = !this.expandedSections[section];
  }

  /**
   * Toggle une compétence dans les filtres
   */
  toggleSkill(skillId: number): void {
    const index = this.filters.selectedSkills.indexOf(skillId);

    if (index > -1) {
      this.filters.selectedSkills.splice(index, 1);
    } else {
      this.filters.selectedSkills.push(skillId);
    }

    this.applyFilters();
  }

  /**
   * Vérifie si une compétence est sélectionnée
   */
  isSkillSelected(skillId: number): boolean {
    return this.filters.selectedSkills.includes(skillId);
  }

  /**
   * Gère le changement de catégorie
   */
  onCategoryChange(): void {
    this.applyFilters();
  }

  /**
   * Gère le changement de statut
   */
  onStatusChange(): void {
    this.applyFilters();
  }

  /**
   * Gère le changement de budget
   */
  onBudgetChange(): void {
    this.applyFilters();
  }

  /**
   * Applique tous les filtres
   */
  applyFilters(): void {
    this.filteredProjects = this.projects.filter((project: Project) => {
      return (
        this.matchesSearch(project) &&
        this.matchesCategory(project) &&
        this.matchesSkills(project) &&
        this.matchesBudget(project)
      );
    });
  }

  /**
   * Vérifie si le projet correspond à la recherche
   */
  private matchesSearch(project: Project): boolean {
    if (!this.filters.searchTerm) return true;

    const searchLower = this.filters.searchTerm.toLowerCase();
    return (
      project.title.toLowerCase().includes(searchLower) ||
      project.description.toLowerCase().includes(searchLower)
    );
  }

  /**
   * Vérifie si le projet correspond à la catégorie sélectionnée
   */
  private matchesCategory(project: Project): boolean {
    if (!this.filters.selectedCategory) return true;
    return project.category_id?.toString() === this.filters.selectedCategory;
  }

  /**
   * Vérifie si le projet correspond aux compétences sélectionnées
   */
  private matchesSkills(project: Project): boolean {
    if (this.filters.selectedSkills.length === 0) return true;

    if (!project.skills || project.skills.length === 0) return false;

    return project.skills.some((skill: Skill) =>
      this.filters.selectedSkills.includes(skill.id)
    );
  }



  /**
   * Vérifie si le projet correspond au budget sélectionné
   */
  private matchesBudget(project: Project): boolean {
    const projectBudget = this.getProjectBudget(project);
    return projectBudget >= this.filters.minBudget &&
      projectBudget <= this.filters.maxBudget;
  }

  /**
   * Récupère le budget du projet en tant que nombre
   */
  private getProjectBudget(project: Project): number {
    if (!project.budget) return 0;

    if (typeof project.budget === 'number') {
      return project.budget;
    }

    if (typeof project.budget === 'string') {
      const cleanBudget = project.budget.replace(/[^\d.]/g, '');
      return parseFloat(cleanBudget) || 0;
    }

    return 0;
  }

  /**
   * Réinitialise tous les filtres
   */
  resetFilters(): void {
    this.filters = {
      searchTerm: '',
      selectedCategory: '',
      selectedSkills: [],
      selectedStatus: '',
      minBudget: 0,
      maxBudget: 50000
    };
    this.applyFilters();
  }

  /**
   * Retourne la classe CSS pour le badge de statut
   */
  getStatusBadgeClass(status: string): string {
    const statusClasses: Record<string, string> = {
      open: 'bg-green-100 text-green-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800'
    };

    return statusClasses[status] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Retourne le libellé traduit du statut
   */
  getStatusLabel(status: string): string {
    const statusLabels: Record<string, string> = {
      open: 'Ouvert',
      in_progress: 'En cours',
      completed: 'Terminé',
      cancelled: 'Annulé'
    };

    return statusLabels[status] || status;
  }

  /**
   * Formate le budget pour l'affichage
   */
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

  /**
   * Formater la durée
   */
  formatDuration(days: number): string {
    if (!days) return 'Non définie';

    if (days < 7) {
      return `${days} jour${days > 1 ? 's' : ''}`;
    } else if (days < 30) {
      const weeks = Math.floor(days / 7);
      return `${weeks} semaine${weeks > 1 ? 's' : ''}`;
    } else if (days < 365) {
      const months = Math.floor(days / 30);
      return `${months} mois`;
    } else {
      const years = Math.floor(days / 365);
      return `${years} an${years > 1 ? 's' : ''}`;
    }
  }
}
