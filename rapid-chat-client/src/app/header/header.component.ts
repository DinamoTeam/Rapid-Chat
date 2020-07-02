import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { windowWhen } from "rxjs/operators";

@Component({
  selector: "app-header",
  templateUrl: "./header.component.html",
  styleUrls: ["./header.component.css"],
})
export class HeaderComponent implements OnInit {
  isExpanded = false;

  constructor(private router: Router) {}

  ngOnInit() {}

  collapse() {
    this.isExpanded = false;
  }

  toggle() {
    this.isExpanded = !this.isExpanded;
  }

  showSuccessAlert = false;
  onBtnHomeClick() {
    const selBox = document.createElement("textarea");
    selBox.style.position = "fixed";
    selBox.style.left = "0";
    selBox.style.top = "0";
    selBox.style.opacity = "0";
    selBox.value = window.location.href;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand("copy");
    document.body.removeChild(selBox);

    this.showSuccessAlert = true;
    this.isExpanded = false;
    alert("Link copied to clipboard!");
  }

  goHome() {
    this.isExpanded = false;
    window.location.replace("/");
  }
}
