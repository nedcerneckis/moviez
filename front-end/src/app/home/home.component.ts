import { Component } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';

@Component({
    selector: 'home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.css']
})

export class HomeComponent {
    movies_list: any = [];
    constructor(public authService: AuthService) {

    }

    ngOnInit(): void {
    }
}