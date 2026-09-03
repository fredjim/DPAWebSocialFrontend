import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateReaction, CreateReactionToComments } from '../../shared/models/create-reaction';
import { EmojiType } from '../../shared/models/emoji-type';
import { ReactionUserToPost } from '../models/reaction-user-to-posts';
import { ReactionUserToComment } from '../models/reaction-user-to-comment';
import { ReactionUserToReply } from '../models/reaction-user-to-reply';

@Injectable({
  providedIn: 'root'
})
export class ReactionService {

  private readonly ROOT_URL = `${environment.BACK_END_HOST_DEV}`;
  private readonly postsUrl = 'posts';
  private readonly reactionsUrl = 'reactions';
  private readonly commentUrl = 'comment';
  private readonly replyReactionsUrl = 'reply-reactions';

  private emojisType$: Observable<EmojiType[]> | null = null;

  constructor(
    private readonly http: HttpClient
  ) {}

  // ── Tipos de emoji ────────────────────────────────────────────────────────────

  getEmojisType(): Observable<EmojiType[]> {
    this.emojisType$ ??= this.http.get<EmojiType[]>(`${this.ROOT_URL}/emoji-type`).pipe(
      shareReplay(1)
    );
    return this.emojisType$;
  }

  // ── Reacciones a posts ────────────────────────────────────────────────────────

  reactToPost(postUuid: string, body: CreateReaction): Observable<ReactionUserToPost> {
    return this.http.post<ReactionUserToPost>(
      `${this.ROOT_URL}/${this.postsUrl}/${postUuid}/${this.reactionsUrl}`,
      body
    );
  }

  deletePostReaction(postUuid: string): Observable<void> {
    return this.http.delete<void>(
      `${this.ROOT_URL}/${this.postsUrl}/${postUuid}/${this.reactionsUrl}`
    );
  }

  // ── Reacciones a comentarios ──────────────────────────────────────────────────

  getCommentReactions(commentUuid: string): Observable<ReactionUserToComment[]> {
    return this.http.get<ReactionUserToComment[]>(
      `${this.ROOT_URL}/${this.commentUrl}/${commentUuid}/${this.reactionsUrl}`
    );
  }

  reactToComment(commentUuid: string, reactionData: CreateReactionToComments): Observable<ReactionUserToComment> {
    return this.http.post<ReactionUserToComment>(
      `${this.ROOT_URL}/${this.commentUrl}/${commentUuid}/${this.reactionsUrl}`,
      reactionData
    );
  }

  updateCommentReaction(reactionUuid: string, reactionData: CreateReaction): Observable<ReactionUserToComment> {
    return this.http.put<ReactionUserToComment>(
      `${this.ROOT_URL}/${this.reactionsUrl}/${reactionUuid}`,
      reactionData
    );
  }

  deleteCommentReaction(commentUuid: string): Observable<void> {
    return this.http.delete<void>(
      `${this.ROOT_URL}/${this.commentUrl}/${commentUuid}/${this.reactionsUrl}`
    );
  }

  // ── Reacciones a replies ──────────────────────────────────────────────────────

  getReplyReactions(replyUuid: string): Observable<ReactionUserToReply[]> {
    return this.http.get<ReactionUserToReply[]>(
      `${this.ROOT_URL}/${this.replyReactionsUrl}/${replyUuid}`
    );
  }

  reactToReply(replyUuid: string, reactionData: CreateReaction): Observable<ReactionUserToReply> {
    return this.http.post<ReactionUserToReply>(
      `${this.ROOT_URL}/${this.replyReactionsUrl}/${replyUuid}`,
      reactionData
    );
  }

  updateReplyReaction(reactionUuid: string, reactionData: CreateReaction): Observable<ReactionUserToReply> {
    return this.http.put<ReactionUserToReply>(
      `${this.ROOT_URL}/${this.replyReactionsUrl}/${reactionUuid}`,
      reactionData
    );
  }

  deleteReplyReaction(replyUuid: string): Observable<void> {
    return this.http.delete<void>(
      `${this.ROOT_URL}/${this.replyReactionsUrl}/${replyUuid}/${this.reactionsUrl}`
    );
  }
}