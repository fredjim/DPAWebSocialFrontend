import { Reactions } from "../../posts/models/reactions";

// interfaz para las respuestas de los Comentarios
export interface Reply {
  uuid: string;
  content: string;
  createdDate: string;
  name: string;
  lastName: string;
  user_photo: string;
  parentReplyUuid?: string;
  reactions: Reactions;
  replies: Reply[];
}