export interface EmojiType {
    uuid:           string;
    emoji_name:     EmojiName;
    emoji_code:     string;
}

export type EmojiName = 'thumbs-up' | 'red-heart' | 'crying-face' |
                         'angry-face' | 'grinning-squinting-face' | 'astonished-face';

export type TranslatedName = 'Me gusta' | 'Me encanta' | 'Me entristece' | 
                           'Me enoja' | 'Me divierte' | 'Me asombra';

export interface EmojiTypeExtended extends EmojiType {
    name_translated: TranslatedName;
}