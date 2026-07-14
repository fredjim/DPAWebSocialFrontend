import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../../authentication/services/auth.service';
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

  private readonly reqHeader = {
    headers: new HttpHeaders({ 'Authorization': 'Bearer ' + this.authService.getToken() })
  };

  constructor(
    private readonly http: HttpClient,
    private readonly authService: AuthService
  ) {}

  // ── Tipos de emoji ────────────────────────────────────────────────────────────

  getEmojisType(): Observable<EmojiType[]> {
    return this.http.get<EmojiType[]>(`${this.ROOT_URL}/emoji-type`);
  }

  // ── Reacciones a posts ────────────────────────────────────────────────────────

  reactToPost(postUuid: string, body: CreateReaction): Observable<ReactionUserToPost> {
    return this.http.post<ReactionUserToPost>(
      `${this.ROOT_URL}/${this.postsUrl}/${postUuid}/${this.reactionsUrl}`,
      body,
      this.reqHeader
    );
  }

  deletePostReaction(postUuid: string): Observable<void> {
    return this.http.delete<void>(
      `${this.ROOT_URL}/${this.postsUrl}/${postUuid}/${this.reactionsUrl}`,
      this.reqHeader
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
      reactionData,
      this.reqHeader
    );
  }

  updateCommentReaction(reactionUuid: string, reactionData: CreateReaction): Observable<ReactionUserToComment> {
    return this.http.put<ReactionUserToComment>(
      `${this.ROOT_URL}/${this.reactionsUrl}/${reactionUuid}`,
      reactionData,
      this.reqHeader
    );
  }

  deleteCommentReaction(commentUuid: string): Observable<void> {
    return this.http.delete<void>(
      `${this.ROOT_URL}/${this.commentUrl}/${commentUuid}/${this.reactionsUrl}`,
      this.reqHeader
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
      reactionData,
      this.reqHeader
    );
  }

  updateReplyReaction(reactionUuid: string, reactionData: CreateReaction): Observable<ReactionUserToReply> {
    return this.http.put<ReactionUserToReply>(
      `${this.ROOT_URL}/${this.replyReactionsUrl}/${reactionUuid}`,
      reactionData,
      this.reqHeader
    );
  }

  deleteReplyReaction(replyUuid: string): Observable<void> {
    return this.http.delete<void>(
      `${this.ROOT_URL}/${this.replyReactionsUrl}/${replyUuid}/${this.reactionsUrl}`,
      this.reqHeader
    );
  }
}