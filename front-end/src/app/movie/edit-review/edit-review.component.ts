import { Component, Inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Review } from 'src/app/interfaces/review';
import { WebService } from 'src/app/web.service';

@Component({
    selector: 'app-edit-review',
    templateUrl: './edit-review.component.html',
    styleUrls: ['./edit-review.component.css']
})
export class EditReviewComponent {

    editReviewForm: any;

    constructor(
        public dialogReviewRef: MatDialogRef<EditReviewComponent>,
        @Inject(MAT_DIALOG_DATA) public review: Review,
        private formBuilder: FormBuilder,
        private webService: WebService
    ) {}

    ngOnInit(): void {
        console.log(this.review);
        this.editReviewForm = this.formBuilder.group({
            sentiment: [this.review['sentiment'], Validators.required],
            review: [this.review['review'], Validators.required]
        });
    }

    onSubmitClick(): void {
        console.log(this.review);
        this.webService.updateReview(
            this.review['_id'],
            this.editReviewForm.value
        ).subscribe();
        this.editReviewForm.reset();
        this.dialogReviewRef.close();
    }

    onBackClick(): void {
        this.dialogReviewRef.close();
    }
}