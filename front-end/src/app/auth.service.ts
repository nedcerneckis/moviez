import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, shareReplay, tap } from 'rxjs';
import { User } from './interfaces/user';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    api_hostname: string = 'http://localhost';
    api_port: string = ':5000';
    api_path: string = '/api/v1.0';
    api_full_url: string = this.api_hostname + this.api_port + this.api_path;
    loggedIn: boolean = false;

    constructor(
        private http: HttpClient
    ) { 
        if(sessionStorage.getItem('access_token')) {
            this.loggedIn = true;
        }
    }

    getAccessToken(): string {
        return sessionStorage.getItem('access_token') || '';
    }

    getUserDetails(): Observable<any> {
        const http_options = {
            headers: {
                "x-access-token": this.getAccessToken()
            }
        }
        return this.http.get(this.api_full_url + "/user", http_options);
    }

    addMovieFavourite(id: string): Observable<any> {
        const http_options = {
            headers: {
                "x-access-token": this.getAccessToken()
            }
        }
        return this.http.post(this.api_full_url + "/user/movie/" + id, null, http_options);
    }

    deleteMovieFromUser(id: string): Observable<any> {
        const http_options = {
            headers: {
                "x-access-token": this.getAccessToken()
            }
        }
        return this.http.delete(this.api_full_url + "/user/movie/" + id, http_options);
    }

    loginUser(user: User): Observable<any> {
        let headers = new HttpHeaders();
        const user_details = user['username'] + ':' + user['password'];
        headers = headers.append("Authorization", "Basic " + btoa(user_details));
        headers = headers.append("Content-Type", "application/x-www-form-urlencoded");
        return this.http.post(this.api_full_url + "/login", user, {headers: headers}).pipe(
            tap((data: any) => {
                sessionStorage.setItem('access_token', data['token'])
                this.loggedIn = true;
            }), shareReplay(),
            catchError((error: any): any => {
                this.loggedIn = false;
                throw error;
            })
        );
    }

    logoutUser(): Observable<any> {
        const http_options = {
            headers: {
                "x-access-token": this.getAccessToken()
            }
        }
        return this.http.post(this.api_full_url + "/logout", null, http_options).pipe(
            tap(() => {
                sessionStorage.clear();
                this.loggedIn = false;
            })
        );
    }

    registerUser(user: User): Observable<any> {
        return this.http.post(this.api_full_url + "/register", user);
    }
}
