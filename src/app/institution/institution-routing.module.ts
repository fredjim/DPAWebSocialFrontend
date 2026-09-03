import { RouterModule, Routes } from "@angular/router";
import { InstitutionAdminComponent } from "./components/institution-admin/institution-admin.component";
import { NgModule } from "@angular/core";


const routes: Routes = [
    {
        path: '',
        component: InstitutionAdminComponent
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class InstitutionRoutingModule {}