import { Section } from "./section";

export interface Menu {
    uuid:           string;
    institution_id: string;
    user_id:        string;
    name:           string;
    date:           string;
    // route:          string;
    sections:       Section[];
}