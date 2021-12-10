import { User } from "./user";

export interface Review {
    _id: string,
    review: string,
    sentiment: string,
    username?: User
}