// Angular modules
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

// App
import { ApplicationRole } from './../auth/model/application-role.enum';
import { AuthService } from './../auth/auth.service';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
    username: string;
    isStudent: boolean;

    constructor(private authService: AuthService, private router: Router) {}

    ngOnInit(): void {
        this.isStudent = this.authService.isInRole(ApplicationRole.Student);
        this.username = this.authService.getUsername();
    }

    logout(): void {
        // log the user out
        this.authService.logout();
        // redirect to login
        this.router.navigate(['/login']);
    }
}
