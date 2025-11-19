import {Component, OnInit} from '@angular/core';
import {ApiService} from "../../services/api.service";
import {ActivatedRoute, Router} from "@angular/router";
import {Project} from "../../models/project";
import {AuthService} from "../../services/auth.service";
import {ProposalService} from "../../services/proposal.service";
import {ProposalFormData} from "../../models/proposal";
import {formatDate} from "@angular/common";

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
  proposalError: string | null = null;
  proposalSuccess: string | null = null;
  hasAlreadyApplied = false;

  // Formulaire de proposition
  proposalForm: ProposalFormData = {
    project_id: 0,
    cover_letter: '',
    proposed_amount: 0,
    proposed_duration: 0
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private authService: AuthService,
    private proposalService: ProposalService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.params['id'];
    this.loadProject(id);
    this.checkIfAlreadyApplied(id);
  }

  loadProject(id: number) {
    this.loading = true;
    this.apiService.getProject(id).subscribe({
      next: (project) => {
        this.project = project;
        this.proposalForm.project_id = project.id;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading project:', error);
        this.error = true;
        this.loading = false;
      }
    });
  }

  /**
   * Vérifie si le freelance connecté a déjà soumis une proposition pour ce projet
   */
  checkIfAlreadyApplied(projectId: number) {
    if (!this.isFreelance) {
      return;
    }

    this.proposalService.getMyProposals().subscribe({
      next: (proposals) => {
        this.hasAlreadyApplied = proposals.some(p => p.project_id === projectId);
      },
      error: (error) => {
        console.error('Error checking proposals:', error);
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
   * Ouvre le modal de soumission de proposition
   */
  openProposalModal() {
    if (!this.authService.isAuthenticated) {
      this.router.navigate(['/login']);
      return;
    }

    if (!this.isFreelance) {
      alert('Seuls les freelances peuvent soumettre des propositions.');
      return;
    }

    this.showProposalModal = true;
    this.proposalError = null;
    this.proposalSuccess = null;
  }

  /**
   * Ferme le modal de soumission de proposition
   */
  closeProposalModal() {
    this.showProposalModal = false;
    this.resetProposalForm();
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
    this.proposalError = null;
    this.proposalSuccess = null;
  }

  /**
   * Valide le formulaire avant soumission
   */
  isFormValid(): boolean {
    return (
      this.proposalForm.cover_letter.trim().length >= 100 &&
      this.proposalForm.proposed_amount > 0 &&
      this.proposalForm.proposed_duration > 0
    );
  }

  /**
   * Soumet la proposition
   */
  submitProposal() {
    if (!this.isFormValid()) {
      this.proposalError = 'Veuillez remplir tous les champs correctement.';
      return;
    }

    this.submittingProposal = true;
    this.proposalError = null;

    this.proposalService.createProposal(this.proposalForm).subscribe({
      next: (response) => {
        this.proposalSuccess = 'Votre proposition a été soumise avec succès !';
        this.hasAlreadyApplied = true;

        // Fermer le modal après 2 secondes
        setTimeout(() => {
          this.closeProposalModal();
        }, 2000);
      },
      error: (error) => {
        console.error('Error submitting proposal:', error);
        this.proposalError = error.message || 'Une erreur est survenue lors de la soumission de votre proposition.';
        this.submittingProposal = false;
      },
      complete: () => {
        this.submittingProposal = false;
      }
    });
  }

  getStatusBadgeClass(status: string): string {
    switch(status) {
      case 'open': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusLabel(status: string): string {
    switch(status) {
      case 'open': return 'Ouvert aux propositions';
      case 'in_progress': return 'En cours de réalisation';
      case 'completed': return 'Terminé';
      case 'cancelled': return 'Annulé';
      default: return status;
    }
  }

  getImageUrl(path: string): string {
    return `http://localhost:8000/storage/${path}`;
  }

  /**
   * Formate le montant en devise
   */
  formatAmount(amount: number | string): string {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      currencyDisplay: 'narrowSymbol'
    }).format(numAmount);
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

  /**
   * Formater la date
   */
  formatDate(dateString: string | null): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
