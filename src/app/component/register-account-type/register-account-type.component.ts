import { Component } from '@angular/core';
import {Router} from "@angular/router";

@Component({
  selector: 'app-register-account-type',
  templateUrl: './register-account-type.component.html',
  styleUrl: './register-account-type.component.css'
})
export class RegisterAccountTypeComponent {
  selectedType: 'client' | 'freelance' | null = null;

  constructor(private router: Router) {}

  selectAccountType(type: 'client' | 'freelance'): void {
    this.selectedType = type;
  }

  continueToRegister(): void {
    if (this.selectedType) {
      this.router.navigate(['/register/details'], {
        queryParams: { type: this.selectedType }
      });
    }
  }
}
