import { Component } from '@angular/core';
import { AuthService } from '../auth.service';
import { Movie } from '../interfaces/movie';
import { User } from '../interfaces/user';

@Component({
    selector: 'home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.css']
})

export class HomeComponent {
    movies_list: any = [];
    user: any;
    constructor(public authService: AuthService) {

    }

    ngOnInit(): void {
        this.getUserDetails();
    }

    getUserDetails(): void {
        this.authService.getUserDetails().subscribe(data => {
            this.user = data;
            this.movies_list = this.user['favourite_movies']
        });
    }

    onUserMovieDelete(id: string): void {
        this.authService.deleteMovieFromUser(id).subscribe();
        this.authService.getUserDetails().subscribe(data => {
            this.user = data;
            this.movies_list = this.user['favourite_movies'];
        });
    }
}