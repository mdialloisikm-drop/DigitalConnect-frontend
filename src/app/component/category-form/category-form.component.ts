import {Component, OnInit} from '@angular/core';
import {Category} from "../../models/category";
import {AdminService} from "../../services/admin.service";
import {ActivatedRoute, Router} from "@angular/router";

@Component({
  selector: 'app-category-form',
  templateUrl: './category-form.component.html',
  styleUrl: './category-form.component.css'
})
export class CategoryFormComponent implements OnInit{
  isEditMode = false;
  categoryId: number | null = null;
  loading = false;
  submitLoading = false;

  formData = {
    name: ''
  };

  formErrors = {
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
        this.categoryId = +params['id'];
        this.loadCategory();
      }
    });
  }

  loadCategory(): void {
    if (!this.categoryId) return;

    this.loading = true;
    this.adminService.getCategory(this.categoryId).subscribe({
      next: (category: Category) => {
        this.formData.name = category.name;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading category:', error);
        this.loading = false;
        alert('Erreur lors du chargement de la catégorie');
        this.goBack();
      }
    });
  }

  validateForm(): boolean {
    let isValid = true;
    this.formErrors = { name: '' };

    if (!this.formData.name.trim()) {
      this.formErrors.name = 'Le nom est requis';
      isValid = false;
    } else if (this.formData.name.trim().length < 2) {
      this.formErrors.name = 'Le nom doit contenir au moins 2 caractères';
      isValid = false;
    } else if (this.formData.name.trim().length > 255) {
      this.formErrors.name = 'Le nom ne doit pas dépasser 255 caractères';
      isValid = false;
    }

    return isValid;
  }

  onSubmit(): void {
    if (!this.validateForm()) {
      return;
    }

    this.submitLoading = true;

    const data = {
      name: this.formData.name.trim()
    };

    const operation = this.isEditMode && this.categoryId
      ? this.adminService.updateCategory(this.categoryId, data)
      : this.adminService.createCategory(data);

    operation.subscribe({
      next: () => {
        this.submitLoading = false;
        alert(this.isEditMode ? 'Catégorie modifiée avec succès' : 'Catégorie créée avec succès');
        this.goBack();
      },
      error: (error) => {
        console.error('Error saving category:', error);
        this.submitLoading = false;

        if (error.error?.errors?.name) {
          this.formErrors.name = error.error.errors.name[0];
        } else {
          alert('Erreur lors de l\'enregistrement de la catégorie');
        }
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/categories']);
  }
}
