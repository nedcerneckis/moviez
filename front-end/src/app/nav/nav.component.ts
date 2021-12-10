import { Component, OnInit } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';

@Component({
    selector: 'navigation',
    templateUrl: './nav.component.html',
    styleUrls: ['./nav.component.css']
})
export class NavComponent implements OnInit {
    profileJson: string = '';

    constructor(
        public authService: AuthService
    ) { }

    ngOnInit(): void {
        this.authService.user$.subscribe((profile: any) => {
            this.profileJson = JSON.stringify(profile, null, 2);
        });
    }
}