import { CommentCounter } from "./comment-counter";
import { Content } from "./content";
import { Reactions } from "./reactions";

export interface Post {
    uuid:              string;
    institution_id:    string;
    user_id:           string;
    name?:             string;
    lastName?:         string;
    commentsEnabled:   boolean;
    post_type: string;
    date:              string;
    content:           Content;
    reactions:         Reactions;
    commentCounter:    CommentCounter;
    is_fb_posted: boolean;
}