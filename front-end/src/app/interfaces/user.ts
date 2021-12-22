import { Movie } from "./movie";

export interface User {
    username: string,
    password: string,
    first_name: string,
    surname: string,
    favouriteMovies?: Movie[]
}