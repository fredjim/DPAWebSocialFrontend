export interface CreateReaction { // Nomenclatura para reaciones a posts y respuestas (replies)
    emoji_type_id:  string;
    reaction_date:  string;
}

export interface CreateReactionToComments {
    emojiTypeId:    string;
    reactionDate:   string;
}