import {Component, OnInit} from '@angular/core';
import {Skill} from "../../models/skill";
import {AdminService} from "../../services/admin.service";
import {ActivatedRoute, Router} from "@angular/router";

interface FormData {
  name: string;
}

interface FormErrors {
  name: string;
}

@Component({
  selector: 'app-skill-form',
  templateUrl: './skill-form.component.html',
  styleUrl: './skill-form.component.css'
})
export class SkillFormComponent implements OnInit{
  isEditMode: boolean = false;
  skillId: number | null = null;
  loading: boolean = false;
  submitLoading: boolean = false;

  formData: FormData = {
    name: ''
  };

  formErrors: FormErrors = {
    name: ''
  };

  constructor(
    private adminService: AdminService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.skillId = +params['id'];
        this.loadSkill();
      }
    });
  }

  loadSkill(): void {
    if (!this.skillId) return;

    this.loading = true;
    this.adminService.getSkill(this.skillId).subscribe({
      next: (skill: Skill) => {
        this.formData.name = skill.name;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement de la compétence:', error);
        this.loading = false;
        alert('Erreur lors du chargement de la compétence');
        this.goBack();
      }
    });
  }

  validateForm(): boolean {
    let isValid = true;
    this.formErrors = { name: '' };

    const trimmedName = this.formData.name.trim();

    if (!trimmedName) {
      this.formErrors.name = 'Le nom est requis';
      isValid = false;
    } else if (trimmedName.length < 2) {
      this.formErrors.name = 'Le nom doit contenir au moins 2 caractères';
      isValid = false;
    } else if (trimmedName.length > 100) {
      this.formErrors.name = 'Le nom ne doit pas dépasser 100 caractères';
      isValid = false;
    }

    return isValid;
  }

  onSubmit(): void {
    if (!this.validateForm()) {
      return;
    }

    this.submitLoading = true;

    const data: FormData = {
      name: this.formData.name.trim()
    };

    const operation = this.isEditMode && this.skillId
      ? this.adminService.updateSkill(this.skillId, data)
      : this.adminService.createSkill(data);

    operation.subscribe({
      next: () => {
        this.submitLoading = false;
        alert(this.isEditMode ? 'Compétence modifiée avec succès' : 'Compétence créée avec succès');
        this.goBack();
      },
      error: (error) => {
        console.error('Erreur lors de l\'enregistrement de la compétence:', error);
        this.submitLoading = false;

        if (error.error?.errors?.name) {
          this.formErrors.name = error.error.errors.name[0];
        } else {
          alert('Erreur lors de l\'enregistrement de la compétence');
        }
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/skills']);
  }
}
