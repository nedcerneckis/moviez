import { Component, OnInit } from '@angular/core';
import { WebService } from '../web.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Review } from '../interfaces/review';
import { Observable } from 'rxjs';
import { FormBuilder, FormControl, FormGroup, FormGroupDirective, NgForm, Validators } from '@angular/forms';
import { Location } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { EditReviewComponent } from './edit-review/edit-review.component';
import { Movie } from '../interfaces/movie';
import { AuthService } from '../auth.service';

@Component({
    selector: 'app-movie',
    templateUrl: './movie.component.html',
    styleUrls: ['./movie.component.css']
})
export class MovieComponent implements OnInit {
    movie_poster: any;
    reviews_list?: Review[];
    page: number = 1;
    maxPage: number = 1;
    reviewForm: any;
    movie!: Movie;
    user: any;

    constructor(
        private webService: WebService,
        private route: ActivatedRoute,
        private router: Router,
        private formBuilder: FormBuilder,
        private location: Location,
        public reviewDialog: MatDialog,
        public authService: AuthService
    ){ }

    ngOnInit(): void {
        if (sessionStorage['page']) {
            this.page = Number(sessionStorage['page']);
        }

        this.getUserDetails();

        this.reviewForm = this.formBuilder.group({
            review: ['', Validators.required],
            sentiment: ['', Validators.required]
        })

        this.webService.getSpecificMovie(this.route.snapshot.params['id'])
            .subscribe(data => {
                this.movie = data[0];
            });

        this.webService.getImagePoster(this.route.snapshot.params['id'])
            .subscribe((data: any) => {
                this.movie_poster = data[0]['url'];
            });

        this.fetchReviewList(this.page);

        this.webService.getReviewMaxPage(this.route.snapshot.params['id'])
            .subscribe((data: any) => {
                this.maxPage = data['max_page'];
            });
    }

    getUserDetails(): void {
        this.authService.getUserDetails().subscribe(data => {
            this.user = data;
        });
    }


    onBackButtonClick(){
        this.location.back();
    }

    openReviewEditDialog(review: Review): void {
        const dialogRef = this.reviewDialog.open(EditReviewComponent, {
            width: '50em',
            height: '30em',
            data: review
        });
        dialogRef.afterClosed().subscribe(result => {
            this.fetchReviewList(this.page);
        });
    }

    onReviewDelete(id: string): void {
        this.webService.deleteReview(id).subscribe();
        this.fetchReviewList(this.page);
    }

    onSubmit(): void {
        this.webService.postReview(this.reviewForm.value)
            .subscribe(() => {
                this.fetchReviewList(this.page);
            });
        this.reviewForm.reset();
        Object.keys(this.reviewForm.controls).forEach(key => {
            this.reviewForm.controls[key].setErrors(null);
        });

    }

    onMovieDelete(id: string): void {
        this.webService.deleteMovie(id).subscribe();
        this.router.navigate(['/movies'])
        this.fetchReviewList(this.page); 
    }

    submitFavouriteMovie(id: string): void {
        this.authService.addMovieFavourite(id).subscribe();
    }

    fetchReviewList(page: number): void {
        this.webService
            .getReviews(this.route.snapshot.params['id'], page)
            .subscribe((data: any) => {
                this.reviews_list = data;
            });
    }
}