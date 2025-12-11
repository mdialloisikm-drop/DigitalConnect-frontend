import {Component, OnDestroy, OnInit} from '@angular/core';
import {forkJoin, finalize, Subject, takeUntil} from "rxjs";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {Category} from "../../models/category";
import {Skill} from "../../models/skill";
import {Project} from "../../models/project";
import {ClientService} from "../../services/client.service";
import {ApiService} from "../../services/api.service";
import {ActivatedRoute, Router} from "@angular/router";

@Component({
  selector: 'app-project-form',
  templateUrl: './project-form.component.html',
  styleUrl: './project-form.component.css'
})
export class ProjectFormComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  projectForm!: FormGroup;
  isEditMode = false;
  projectId: number | null = null;
  isLoading = false;
  isSubmitting = false;
  errorMessage = '';

  categories: Category[] = [];
  skills: Skill[] = [];
  selectedSkills: Skill[] = []; // Changé de number[] à Skill[]
  selectedFiles: File[] = [];
  existingAttachments: any[] = [];
  showCancelConfirm = false;

  // Nouvelles propriétés pour la recherche de compétences
  skillSearchTerm = '';
  filteredSkills: Skill[] = [];
  showSkillDropdown = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly clientService: ClientService,
    private readonly apiService: ApiService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.checkEditMode();
    this.loadFormData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialiser le formulaire
   */
  private initializeForm(): void {
    this.projectForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(255)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      category_id: ['', Validators.required],
      budget: ['', [Validators.min(0)]],
      duration: ['', [Validators.required, Validators.min(1)]]
    });
  }

  /**
   * Vérifier si on est en mode édition
   */
  private checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.projectId = parseInt(id, 10);
    }
  }

  /**
   * Charger les données du formulaire
   */
  private loadFormData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    console.log('📄 Chargement des données du formulaire...');

    const categories$ = this.apiService.getCategories();
    const skills$ = this.apiService.getSkills();

    if (this.isEditMode && this.projectId) {
      forkJoin({
        categories: categories$,
        skills: skills$,
        project: this.clientService.getProjectById(this.projectId)
      })
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => this.isLoading = false)
        )
        .subscribe({
          next: (data) => {
            this.handleLoadedData(data.categories, data.skills, data.project);
          },
          error: (error) => {
            this.handleLoadError(error);
          }
        });
    } else {
      forkJoin({
        categories: categories$,
        skills: skills$
      })
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => this.isLoading = false)
        )
        .subscribe({
          next: (data) => {
            this.handleLoadedData(data.categories, data.skills);
          },
          error: (error) => {
            this.handleLoadError(error);
          }
        });
    }
  }

  /**
   * Gérer les données chargées
   */
  private handleLoadedData(categories: Category[], skills: Skill[], project?: Project): void {
    console.log('📦 Données reçues:', { categories: categories.length, skills: skills.length });

    this.categories = categories;
    this.skills = skills;

    console.log('📂 Catégories chargées:', this.categories.length);
    console.log('🎯 Compétences chargées:', this.skills.length);

    if (project) {
      console.log('✏️ Mode édition - Projet:', project);
      this.fillFormWithProject(project);
    }
  }

  /**
   * Remplir le formulaire avec les données du projet
   */
  private fillFormWithProject(project: Project): void {
    this.projectForm.patchValue({
      title: project.title,
      description: project.description,
      category_id: project.category_id || '',
      budget: project.budget || '',
      duration: project.duration
    });

    if (project.skills && project.skills.length > 0) {
      this.selectedSkills = project.skills;
      console.log('🎯 Compétences sélectionnées:', this.selectedSkills);
    }

    if (project.attachments && project.attachments.length > 0) {
      this.existingAttachments = project.attachments;
      console.log('📎 Pièces jointes existantes:', this.existingAttachments.length);
    }
  }

  /**
   * Gérer les erreurs de chargement
   */
  private handleLoadError(error: Error): void {
    this.errorMessage = error.message || 'Erreur lors du chargement des données';
    console.error('❌ Erreur:', error);
  }

  /**
   * Rechercher des compétences
   */
  onSkillSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.skillSearchTerm = input.value.trim().toLowerCase();

    if (this.skillSearchTerm.length > 0) {
      this.filteredSkills = this.skills.filter(skill =>
        skill.name.toLowerCase().includes(this.skillSearchTerm) &&
        !this.selectedSkills.some(s => s.id === skill.id)
      );
      this.showSkillDropdown = this.filteredSkills.length > 0;
    } else {
      this.filteredSkills = [];
      this.showSkillDropdown = false;
    }
  }

  /**
   * Sélectionner une compétence depuis la liste filtrée
   */
  selectSkill(skill: Skill): void {
    if (!this.selectedSkills.some(s => s.id === skill.id)) {
      this.selectedSkills.push(skill);
      console.log('🎯 Compétence ajoutée:', skill.name);
    }

    // Réinitialiser la recherche
    this.skillSearchTerm = '';
    this.filteredSkills = [];
    this.showSkillDropdown = false;
  }

  /**
   * Retirer une compétence sélectionnée
   */
  removeSkill(skill: Skill): void {
    this.selectedSkills = this.selectedSkills.filter(s => s.id !== skill.id);
    console.log('🎯 Compétence retirée:', skill.name);
  }

  /**
   * Fermer le dropdown de compétences
   */
  closeSkillDropdown(): void {
    setTimeout(() => {
      this.showSkillDropdown = false;
    }, 200);
  }

  /**
   * Gérer la sélection de fichiers
   */
  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.selectedFiles = Array.from(input.files);
      console.log('📎 Fichiers sélectionnés:', this.selectedFiles.length);
    }
  }

  /**
   * Retirer un fichier sélectionné
   */
  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
  }

  /**
   * Supprimer une pièce jointe existante
   */
  removeExistingAttachment(index: number): void {
    if (confirm('Voulez-vous vraiment supprimer cette pièce jointe ?')) {
      this.existingAttachments.splice(index, 1);
      console.log('🗑️ Pièce jointe supprimée');
    }
  }

  /**
   * Soumettre le formulaire
   */
  onSubmit(): void {
    if (this.projectForm.invalid) {
      this.markFormGroupTouched(this.projectForm);
      console.warn('⚠️ Formulaire invalide');
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    console.log('📤 Soumission du formulaire...');

    const formData = this.buildFormData();

    const request = this.isEditMode && this.projectId
      ? this.clientService.updateProject(this.projectId, formData)
      : this.clientService.createProject(formData);

    request
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isSubmitting = false)
      )
      .subscribe({
        next: (response) => {
          console.log('✅ Projet sauvegardé:', response);
          this.router.navigate(['/client/projects']);
        },
        error: (error) => {
          this.errorMessage = error.message || 'Erreur lors de la sauvegarde du projet';
          console.error('❌ Erreur:', error);
        }
      });
  }

  /**
   * Construire le FormData
   */
  private buildFormData(): FormData {
    const formData = new FormData();
    const formValue = this.projectForm.value;

    console.log('🔨 Construction du FormData:', formValue);

    // Ajouter les champs du formulaire
    Object.keys(formValue).forEach(key => {
      const value = formValue[key];
      if (value !== null && value !== undefined && value !== '') {
        formData.append(key, value.toString());
      }
    });

    // Ajouter les compétences
    if (this.selectedSkills.length > 0) {
      this.selectedSkills.forEach(skill => {
        formData.append('skills[]', skill.id.toString());
      });
    }

    // Ajouter les fichiers
    if (this.selectedFiles.length > 0) {
      this.selectedFiles.forEach(file => {
        formData.append('attachments[]', file);
      });
    }

    // Ajouter _method pour la mise à jour
    if (this.isEditMode) {
      formData.append('_method', 'PUT');
    }

    return formData;
  }

  /**
   * Marquer tous les champs comme touchés
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Annuler et retourner à la liste
   */
  cancel(): void {
    if (this.projectForm.dirty || this.selectedFiles.length > 0) {
      this.showCancelConfirm = true;
    } else {
      this.navigateBack();
    }
  }

  /**
   * Confirmer l'annulation
   */
  confirmCancel(): void {
    this.showCancelConfirm = false;
    this.navigateBack();
  }

  /**
   * Annuler la confirmation
   */
  cancelConfirmation(): void {
    this.showCancelConfirm = false;
  }

  /**
   * Retourner à la liste des projets
   */
  private navigateBack(): void {
    this.router.navigate(['/client/projects']);
  }

  /**
   * Vérifier si un champ est invalide et touché
   */
  isFieldInvalid(fieldName: string): boolean {
    const field = this.projectForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  /**
   * Obtenir le message d'erreur d'un champ
   */
  getFieldError(fieldName: string): string {
    const field = this.projectForm.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.errors['required']) return 'Ce champ est requis';
    if (field.errors['minlength']) {
      return `Minimum ${field.errors['minlength'].requiredLength} caractères`;
    }
    if (field.errors['maxlength']) {
      return `Maximum ${field.errors['maxlength'].requiredLength} caractères`;
    }
    if (field.errors['min']) {
      return `La valeur doit être supérieure à ${field.errors['min'].min}`;
    }

    return 'Champ invalide';
  }
}
