export interface FacebookConfig {
  uuid: string | null;
  institution_id: string;
  page_id: string | null;
  configured: boolean;
  enabled: boolean;
  token_hint: string | null;
}

export interface SaveFacebookConfigDTO {
  page_id: string;
  access_token: string;
  enabled?: boolean;
}
