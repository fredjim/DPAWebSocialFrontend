import { Content } from "./content";

export interface CreatePost {
    date:             string;
    commentsEnabled?: boolean;
    post_type:        string;
    content:          Content;
    fb_post_enable:   boolean;
}