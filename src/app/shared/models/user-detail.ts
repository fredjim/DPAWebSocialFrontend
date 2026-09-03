export interface UserDetail {
    uuid:                   string;
    enable:                 boolean;
    institutionId:          string;
    name:                   string;
    lastName:               string;
    password:               string;
    email:                  string;
    phone:                  string;
    photo_profile_path:     string | null;
    photo_cover_path:       string;
    role:                   string;
    photoProfileFileUuid:  string | null;
    photoCoverFileUuid?:    string;
}