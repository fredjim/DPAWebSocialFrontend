import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../../authentication/services/auth.service';
import { environment } from '../../../environments/environment';
import { CreateReaction } from '../../shared/models/create-reaction';
import { EmojiType } from '../../shared/models/emoji-type';

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

  reactToPost(postUuid: string, body: CreateReaction): Observable<any> {
    return this.http.post<any>(
      `${this.ROOT_URL}/${this.postsUrl}/${postUuid}/${this.reactionsUrl}`,
      body,
      this.reqHeader
    );
  }

  deletePostReaction(postUuid: string): Observable<any> {
    return this.http.delete<any>(
      `${this.ROOT_URL}/${this.postsUrl}/${postUuid}/${this.reactionsUrl}`,
      this.reqHeader
    );
  }

  // ── Reacciones a comentarios ──────────────────────────────────────────────────

  getCommentReactions(commentUuid: string): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.ROOT_URL}/${this.commentUrl}/${commentUuid}/${this.reactionsUrl}`
    );
  }

  reactToComment(commentUuid: string, reactionData: any): Observable<any> {
    return this.http.post<any>(
      `${this.ROOT_URL}/${this.commentUrl}/${commentUuid}/${this.reactionsUrl}`,
      reactionData,
      this.reqHeader
    );
  }

  updateCommentReaction(reactionUuid: string, reactionData: any): Observable<any> {
    return this.http.put<any>(
      `${this.ROOT_URL}/${this.reactionsUrl}/${reactionUuid}`,
      reactionData,
      this.reqHeader
    );
  }

  deleteCommentReaction(commentUuid: string): Observable<any> {
    return this.http.delete<any>(
      `${this.ROOT_URL}/${this.commentUrl}/${commentUuid}/${this.reactionsUrl}`,
      this.reqHeader
    );
  }

  // ── Reacciones a replies ──────────────────────────────────────────────────────

  getReplyReactions(replyUuid: string): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.ROOT_URL}/${this.replyReactionsUrl}/${replyUuid}`
    );
  }

  reactToReply(replyUuid: string, reactionData: any): Observable<any> {
    return this.http.post<any>(
      `${this.ROOT_URL}/${this.replyReactionsUrl}/${replyUuid}`,
      reactionData,
      this.reqHeader
    );
  }

  updateReplyReaction(reactionUuid: string, reactionData: any): Observable<any> {
    return this.http.put<any>(
      `${this.ROOT_URL}/${this.replyReactionsUrl}/${reactionUuid}`,
      reactionData,
      this.reqHeader
    );
  }

  deleteReplyReaction(replyUuid: string): Observable<any> {
    return this.http.delete<any>(
      `${this.ROOT_URL}/${this.replyReactionsUrl}/${replyUuid}/${this.reactionsUrl}`,
      this.reqHeader
    );
  }
}