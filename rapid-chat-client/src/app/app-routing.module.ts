import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { HomeComponent } from "./home/home.component";
import { ChatComponent } from "./chat/chat.component";

const routes: Routes = [
  { path: "", component: HomeComponent },
  { path: "chat", redirectTo: "chat/NONE", pathMatch: "full" },
  { path: "chat/:roomName", component: ChatComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
