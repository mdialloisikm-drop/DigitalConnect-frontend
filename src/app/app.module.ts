import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import {HTTP_INTERCEPTORS, HttpClientModule} from "@angular/common/http";
import { NavbarComponent } from './component/navbar/navbar.component';
import { HomeComponent } from './component/home/home.component';
import {ProjectComponent} from "./component/project/project.component";
import { ProjectDetailComponent } from './component/project-detail/project-detail.component';
import { ServicesComponent } from './component/services/services.component';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import { ServiceDetailComponent } from './component/service-detail/service-detail.component';
import { LoginComponent } from './component/login/login.component';
import {AuthInterceptor} from "./interceptor/auth.interceptor";
import { AdminLayoutComponent } from './component/admin-layout/admin-layout.component';
import { DashboardComponent } from './component/dashboard/dashboard.component';
import { CategoriesListComponent } from './component/categories-list/categories-list.component';
import { CategoryFormComponent } from './component/category-form/category-form.component';
import { SkillsListComponent } from './component/skills-list/skills-list.component';
import { SkillFormComponent } from './component/skill-form/skill-form.component';
import { UsersListComponent } from './component/users-list/users-list.component';
import { FreelanceLayoutComponent } from './component/freelance-layout/freelance-layout.component';
import { FreelanceDashboardComponent } from './component/freelance-dashboard/freelance-dashboard.component';
import { FreelanceServicesComponent } from './component/freelance-services/freelance-services.component';
import { MyProposalsComponent } from './component/my-proposals/my-proposals.component';
import { ActiveContractsComponent } from './component/active-contracts/active-contracts.component';
import { ContractDetailsComponent } from './component/contract-details/contract-details.component';
import { FreelanceOrdersComponent } from './component/freelance-orders/freelance-orders.component';
import { FreelanceOrderDetailComponent } from './component/freelance-order-detail/freelance-order-detail.component';
import { ClientLayoutComponent } from './component/client-layout/client-layout.component';
import { ClientDashboardComponent } from './component/client-dashboard/client-dashboard.component';
import { ClientProjectsComponent } from './component/client-projects/client-projects.component';
import { ProjectFormComponent } from './component/project-form/project-form.component';
import { ClientProposalsComponent } from './component/client-proposals/client-proposals.component';
import { ClientProposalDetailsComponent } from './component/client-proposal-details/client-proposal-details.component';
import { ClientManageProjectComponent } from './component/client-manage-project/client-manage-project.component';
import { ConversationListComponent } from './component/conversation-list/conversation-list.component';
import { ConversationComponent } from './component/conversation/conversation.component';
import { MessagesLayoutComponent } from './component/messages-layout/messages-layout.component';
import { ProfileComponent } from './component/profile/profile.component';
import { RegisterAccountTypeComponent } from './component/register-account-type/register-account-type.component';
import { RegisterDetailsComponent } from './component/register-details/register-details.component';
import { VerifyEmailComponent } from './component/verify-email/verify-email.component';
import { EmailConfirmedComponent } from './component/email-confirmed/email-confirmed.component';
import { PendingProjectsComponent } from './component/pending-projects-admin/pending-projects/pending-projects.component';
import { PendingProjectDetailsComponent } from './component/pending-projects-admin/pending-project-details/pending-project-details.component';

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    HomeComponent,
    ProjectComponent,
    ProjectDetailComponent,
    ServicesComponent,
    ServiceDetailComponent,
    LoginComponent,
    AdminLayoutComponent,
    DashboardComponent,
    CategoriesListComponent,
    CategoryFormComponent,
    SkillsListComponent,
    SkillFormComponent,
    UsersListComponent,
    FreelanceLayoutComponent,
    FreelanceDashboardComponent,
    FreelanceServicesComponent,
    MyProposalsComponent,
    ActiveContractsComponent,
    ContractDetailsComponent,
    FreelanceOrdersComponent,
    FreelanceOrderDetailComponent,
    ClientLayoutComponent,
    ClientDashboardComponent,
    ClientProjectsComponent,
    ProjectFormComponent,
    ClientProposalsComponent,
    ClientProposalDetailsComponent,
    ClientManageProjectComponent,
    ConversationListComponent,
    ConversationComponent,
    MessagesLayoutComponent,
    ProfileComponent,
    RegisterAccountTypeComponent,
    RegisterDetailsComponent,
    VerifyEmailComponent,
    EmailConfirmedComponent,
    PendingProjectsComponent,
    PendingProjectDetailsComponent,
  ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        HttpClientModule,
        FormsModule,
        ReactiveFormsModule,
    ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
