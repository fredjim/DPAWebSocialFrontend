import { Content } from "./content";

export interface CreatePost {
    institution_id:    string;
    date:              string;
    comment_config_id: string;
    post_type: string;
    content:           Content;
    fb_post_enable: boolean;
}