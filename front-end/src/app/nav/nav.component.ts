import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth.service';

@Component({
    selector: 'navigation',
    templateUrl: './nav.component.html',
    styleUrls: ['./nav.component.css']
})
export class NavComponent implements OnInit {
    profileJson: string = '';
    user: any;

    constructor(
        public authService: AuthService
    ) { }

    ngOnInit(): void {
        this.authService.getUserDetails().subscribe(user => {
            this.user = user;
        });
    }

    onLogoutSubmit(): void {
        this.authService.logoutUser().subscribe(() =>
            window.location.reload()
        );
    }
}