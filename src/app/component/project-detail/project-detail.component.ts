import {ChangeDetectorRef, Component, NgZone, OnInit} from '@angular/core';
import {ApiService} from "../../services/api.service";
import {ActivatedRoute, Router} from "@angular/router";
import {Project} from "../../models/project";
import {AuthService} from "../../services/auth.service";
import {ProposalService} from "../../services/proposal.service";
import {ProposalFormData} from "../../models/proposal";
import {finalize, Subject, takeUntil} from "rxjs";

@Component({
  selector: 'app-project-detail',
  templateUrl: './project-detail.component.html',
  styleUrl: './project-detail.component.css'
})
export class ProjectDetailComponent implements OnInit{
  project: Project | undefined;
  loading = true;
  error = false;

  // État pour le modal de proposition
  showProposalModal = false;
  submittingProposal = false;
  hasAlreadyApplied = false;
  checkingProposal = false;

  // Subject pour la désinscription
  private destroy$ = new Subject<void>();

  // Alertes Tailwind
  alert: {
    show: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
  } = {
    show: false,
    type: 'info',
    title: '',
    message: ''
  };

  // Formulaire de proposition
  proposalForm: ProposalFormData = {
    project_id: 0,
    cover_letter: '',
    proposed_amount: 0,
    proposed_duration: 0
  };

  // Erreurs de validation du formulaire
  formErrors: {
    cover_letter: string;
    proposed_amount: string;
    proposed_duration: string;
  } = {
    cover_letter: '',
    proposed_amount: '',
    proposed_duration: ''
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private authService: AuthService,
    private proposalService: ProposalService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    const id = +this.route.snapshot.params['id'];
    this.loadProject(id);
  }

  ngOnDestroy(): void {
    this.destroy$. next();
    this.destroy$. complete();
  }

  /**
   * Charge le projet
   */
  loadProject(projectId: number): void {
    this.loading = true;
    this.error = false;

    this.apiService.getProject(projectId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (project) => {
          this.ngZone.run(() => {
            this.project = project;
            this.proposalForm.project_id = project.id;
            this.loading = false;

            // Vérifier les candidatures après avoir chargé le projet
            if (this.isFreelance) {
              this.checkExistingProposal(projectId);
            } else {
              this.checkingProposal = false;
            }

            this.cdr.detectChanges();
          });
        },
        error: (error) => {
          this.ngZone.run(() => {
            console.error('Erreur lors du chargement du projet:', error);
            this. error = true;
            this. loading = false;
            this. cdr.detectChanges();
          });
        }
      });
  }

  /**
   * Vérifie si le freelance a déjà candidaté
   */
  checkExistingProposal(projectId: number): void {
    this.checkingProposal = true;

    this.proposalService.getMyProposals()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.checkingProposal = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (proposals) => {
          this.ngZone.run(() => {
            this.hasAlreadyApplied = proposals.some(
              (p: any) => {
                const pProjectId = p.project_id || p.project?.id;
                return pProjectId === projectId;
              }
            );
            this.checkingProposal = false;
            this.cdr.detectChanges();
          });
        },
        error: (error) => {
          this.ngZone.run(() => {
            console.error('Erreur lors de la vérification des propositions:', error);
            this.checkingProposal = false;
            this.cdr.detectChanges();
          });
        }
      });
  }

  /**
   * Vérifie si l'utilisateur connecté est un freelance
   */
  get isFreelance(): boolean {
    return this.authService.isFreelance;
  }

  /**
   * Vérifie si l'utilisateur est authentifié
   */
  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated;
  }

  /**
   * Vérifie si le freelance peut soumettre une proposition
   */
  get canSubmitProposal(): boolean {
    return this. project?.status === 'open' &&
      this.isFreelance &&
      !this.hasAlreadyApplied &&
      !this.checkingProposal;
  }

  /**
   * Affiche une alerte
   */
  showAlert(type: 'success' | 'error' | 'warning' | 'info', title: string, message: string, autoClose: boolean = true) {
    this.alert = {
      show: true,
      type,
      title,
      message
    };

    if (autoClose) {
      setTimeout(() => {
        this.closeAlert();
      }, 5000);
    }
  }

  /**
   * Ferme l'alerte
   */
  closeAlert() {
    this.alert. show = false;
    this. cdr.detectChanges();
  }

  /**
   * Ouvre le modal de soumission de proposition
   */
  openProposalModal() {
    if (!this.isAuthenticated) {
      this.showAlert('warning', 'Connexion requise', 'Veuillez vous connecter pour soumettre une proposition.');
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 2000);
      return;
    }

    if (!this.isFreelance) {
      this.showAlert('warning', 'Accès restreint', 'Seuls les freelances peuvent soumettre des propositions.');
      return;
    }

    if (this.hasAlreadyApplied) {
      this.showAlert('info', 'Déjà candidaté', 'Vous avez déjà soumis une proposition pour ce projet.');
      return;
    }

    this.showProposalModal = true;
    this.resetFormErrors();
    this.cdr.detectChanges();
  }

  /**
   * Ferme le modal de soumission de proposition
   */
  closeProposalModal() {
    this.showProposalModal = false;
    this.resetProposalForm();
    this. cdr.detectChanges();
  }

  /**
   * Réinitialise le formulaire de proposition
   */
  resetProposalForm() {
    this.proposalForm = {
      project_id: this.project?.id || 0,
      cover_letter: '',
      proposed_amount: 0,
      proposed_duration: 0
    };
    this. resetFormErrors();
  }

  /**
   * Réinitialise les erreurs du formulaire
   */
  resetFormErrors() {
    this.formErrors = {
      cover_letter: '',
      proposed_amount: '',
      proposed_duration: ''
    };
  }

  /**
   * Valide le formulaire avant soumission
   */
  validateForm(): boolean {
    this.resetFormErrors();
    let isValid = true;

    if (!this.proposalForm.cover_letter || this.proposalForm.cover_letter.trim(). length < 100) {
      this.formErrors.cover_letter = 'La lettre de motivation doit contenir au moins 100 caractères.';
      isValid = false;
    }

    if (!this.proposalForm.proposed_amount || this. proposalForm.proposed_amount <= 0) {
      this. formErrors.proposed_amount = 'Veuillez entrer un montant valide.';
      isValid = false;
    }

    if (!this. proposalForm.proposed_duration || this.proposalForm.proposed_duration <= 0) {
      this.formErrors.proposed_duration = 'Veuillez entrer une durée valide.';
      isValid = false;
    }

    return isValid;
  }

  /**
   * Vérifie si le formulaire est valide (pour désactiver le bouton)
   */
  isFormValid(): boolean {
    return (
      this.proposalForm. cover_letter. trim().length >= 100 &&
      this.proposalForm. proposed_amount > 0 &&
      this.proposalForm. proposed_duration > 0
    );
  }

  /**
   * Soumet la proposition
   */
  submitProposal() {
    if (!this.validateForm()) {
      return;
    }

    this.submittingProposal = true;
    this.cdr.detectChanges();

    this.proposalService.createProposal(this.proposalForm)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.ngZone.run(() => {
            this.hasAlreadyApplied = true;
            this.submittingProposal = false;
            this.closeProposalModal();
            this.showAlert('success', 'Proposition soumise ! ', 'Votre proposition a été envoyée avec succès.  Le client l\'examinera prochainement.');
            this.cdr.detectChanges();
          });
        },
        error: (error) => {
          this.ngZone. run(() => {
            console. error('Error submitting proposal:', error);
            this.showAlert('error', 'Erreur', error.message || 'Une erreur est survenue lors de la soumission de votre proposition.');
            this.submittingProposal = false;
            this.cdr.detectChanges();
          });
        }
      });
  }

  /**
   * Retourne la classe CSS pour le badge de catégorie
   */
  getCategoryBadgeClass(): string {
    return 'bg-purple-100 text-purple-800 border border-purple-200';
  }

  /**
   * Retourne la classe CSS pour le badge de statut
   */
  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  }

  /**
   * Retourne le libellé du statut
   */
  getStatusLabel(status: string): string {
    switch (status) {
      case 'open':
        return 'Ouvert';
      case 'in_progress':
        return 'En cours';
      case 'completed':
        return 'Terminé';
      case 'cancelled':
        return 'Annulé';
      default:
        return status;
    }
  }

  /**
   * Retourne l'URL de l'image
   */
  getImageUrl(path: string): string {
    if (! path) return '';
    if (path.startsWith('http')) return path;
    return `http://localhost:8000/storage/${path}`;
  }

  /**
   * Formate le montant en devise
   */
  formatAmount(amount: number | string): string {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (! numAmount) return 'À négocier';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      currencyDisplay: 'narrowSymbol'
    }).format(numAmount);
  }

  /**
   * Formate la durée
   */
  formatDuration(days: number): string {
    if (! days) return 'Non définie';

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

  /**
   * Formate la date
   */
  formatDate(dateString: string | null): string {
    if (!dateString) return 'Non définie';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Retourne les initiales du client
   */
  getClientInitials(): string {
    const name = this.project?.client?. user?.full_name;
    if (!name) return '? ';
    return name.charAt(0).toUpperCase();
  }

  /**
   * Compte le nombre de caractères de la lettre de motivation
   */
  get coverLetterLength(): number {
    return this. proposalForm.cover_letter?. trim().length || 0;
  }
}
