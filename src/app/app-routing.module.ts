import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {HomeComponent} from "./component/home/home.component";
import {ProjectComponent} from "./component/project/project.component";
import {ProjectDetailComponent} from "./component/project-detail/project-detail.component";
import {ServicesComponent} from "./component/services/services.component";
import {ServiceDetailComponent} from "./component/service-detail/service-detail.component";
import {LoginComponent} from "./component/login/login.component";
import {AuthGuard} from "./guard/auth.guard";
import {CategoryFormComponent} from "./component/category-form/category-form.component";
import {AdminLayoutComponent} from "./component/admin-layout/admin-layout.component";
import {AdminGuard} from "./guard/admin.guard";
import {DashboardComponent} from "./component/dashboard/dashboard.component";
import {CategoriesListComponent} from "./component/categories-list/categories-list.component";
import {SkillFormComponent} from "./component/skill-form/skill-form.component";
import {SkillsListComponent} from "./component/skills-list/skills-list.component";
import {UsersListComponent} from "./component/users-list/users-list.component";
import {FreelanceGuard} from "./guard/freelance.guard";
import {FreelanceServicesComponent} from "./component/freelance-services/freelance-services.component";
import {FreelanceDashboardComponent} from "./component/freelance-dashboard/freelance-dashboard.component";
import {MyProposalsComponent} from "./component/my-proposals/my-proposals.component";
import {ContractDetailsComponent} from "./component/contract-details/contract-details.component";
import {ActiveContractsComponent} from "./component/active-contracts/active-contracts.component";
import {FreelanceOrderDetailComponent} from "./component/freelance-order-detail/freelance-order-detail.component";
import {FreelanceOrdersComponent} from "./component/freelance-orders/freelance-orders.component";
import {ClientProjectsComponent} from "./component/client-projects/client-projects.component";
import {ClientLayoutComponent} from "./component/client-layout/client-layout.component";
import {ProjectFormComponent} from "./component/project-form/project-form.component";
import {ClientDashboardComponent} from "./component/client-dashboard/client-dashboard.component";
import {ClientProposalsComponent} from "./component/client-proposals/client-proposals.component";
import {ClientGuard} from "./guard/client.guard";
import {ClientProposalDetailsComponent} from "./component/client-proposal-details/client-proposal-details.component";
import {ClientManageProjectComponent} from "./component/client-manage-project/client-manage-project.component";
import {ConversationListComponent} from "./component/conversation-list/conversation-list.component";
import {ConversationComponent} from "./component/conversation/conversation.component";
import {MessagesLayoutComponent} from "./component/messages-layout/messages-layout.component";
import {ProfileComponent} from "./component/profile/profile.component";
import {RegisterAccountTypeComponent} from "./component/register-account-type/register-account-type.component";
import {RegisterDetailsComponent} from "./component/register-details/register-details.component";
import {VerifyEmailComponent} from "./component/verify-email/verify-email.component";
import {EmailConfirmedComponent} from "./component/email-confirmed/email-confirmed.component";
import {
  PendingProjectDetailsComponent
} from "./component/pending-projects-admin/pending-project-details/pending-project-details.component";
import {PendingProjectsComponent} from "./component/pending-projects-admin/pending-projects/pending-projects.component";
import {PendingServicesComponent} from "./component/pending-services/pending-services.component";
import {ClientOrdersComponent} from "./component/client-orders/client-orders.component";
import {ClientOrderDetailComponent} from "./component/client-order-detail/client-order-detail.component";

const routes: Routes = [
  { path: '', component: HomeComponent },
  {
    path: 'login',
    component: LoginComponent
  },
  { path: 'register', component: RegisterAccountTypeComponent },
  { path: 'register/details', component: RegisterDetailsComponent },
  { path: 'register/verify-email', component: VerifyEmailComponent },
  { path: 'auth/verify-email', component: EmailConfirmedComponent },
  { path: 'projects', component: ProjectComponent },
  { path: 'projects/:id', component: ProjectDetailComponent },
  { path: 'services', component: ServicesComponent },
  { path: 'services/:id', component: ServiceDetailComponent },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [AuthGuard],
    data: { title: 'Mon profil' }
  },
  // Admin routes
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [AdminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'categories', component: CategoriesListComponent },
      { path: 'categories/add', component: CategoryFormComponent },
      { path: 'categories/edit/:id', component: CategoryFormComponent },
      { path: 'skills', component: SkillsListComponent },
      { path: 'skills/add', component: SkillFormComponent },
      { path: 'skills/edit/:id', component: SkillFormComponent },
      {
        path: 'users',
        component: UsersListComponent
      },
      { path: 'projects/pending', component: PendingProjectsComponent },
      { path: 'projects/details/:id', component: PendingProjectDetailsComponent },
      { path: 'services/pending', component: PendingServicesComponent },
    ]
  },

  // Client routes
  {
    path: 'client',
    component: ClientLayoutComponent,
    canActivate: [ClientGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        component: ClientDashboardComponent
      },
      {
        path: 'projects',
        component: ClientProjectsComponent
      },
      {
        path: 'projects/new',
        component: ProjectFormComponent
      },
      {
        path: 'projects/:id/edit',
        component: ProjectFormComponent
      },
      {
        path: 'proposals',
        component: ClientProposalsComponent
      },
      {
        path: 'proposals/:id',
        component: ClientProposalDetailsComponent,
        data: { title: 'Détails des candidatures' }
      },
      {
        path: 'projects/:id/manage',
        component: ClientManageProjectComponent,
        canActivate: [AuthGuard, ClientGuard]
      },
      {
        path: 'orders',
        component: ClientOrdersComponent
      },
      {
        path: 'orders/:id',
        component: ClientOrderDetailComponent
      }
    ]

  },

  // Freelance routes
  {
    path: 'freelance',
    canActivate: [FreelanceGuard],
    data: { roles: ['freelance'] },
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        component: FreelanceDashboardComponent
      },
      {
        path: 'services',
        component: FreelanceServicesComponent
      },
      {
        path: 'my-proposals',
        component: MyProposalsComponent,
        data: { title: 'Mes candidatures' }
      },
      {
        path: 'orders',
        component: FreelanceOrdersComponent,
        data: { title: 'Mes commandes' }
      },
      {
        path: 'order/:id',
        component: FreelanceOrderDetailComponent,
        data: { title: 'Détails de la commande' }
      },
      {
        path: 'contracts',
        component: ActiveContractsComponent
      },
      {
        path: 'contract/:id',
        component: ContractDetailsComponent
      }
    ]
  },
  {
    path: 'messages',
    component: MessagesLayoutComponent,
    canActivate: [AuthGuard],
    data: {
      title: 'Messages',
      reuse: true  // Custom flag pour votre stratégie de réutilisation
    },
    children: [
      {
        path: '',
        component: ConversationListComponent,
        data: { title: 'Messages' }
      },
      {
        path: ':id',
        component: ConversationComponent,
        data: { title: 'Conversation' }
      }
    ]
  },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes,
    {
      onSameUrlNavigation: 'ignore',
      scrollPositionRestoration: 'top',
      anchorScrolling: 'enabled',
      enableTracing: false
    })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
