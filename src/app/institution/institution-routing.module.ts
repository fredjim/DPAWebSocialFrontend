import { RouterModule, Routes } from "@angular/router";
import { ProfileInstitutionComponent } from "./components/profile-institution/profile-institution.component";
import { NgModule } from "@angular/core";


const routes: Routes = [
    {
        path: '',
        component: ProfileInstitutionComponent
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class InstitutionRoutingModule {}