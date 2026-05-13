export interface AdminUser {
  uuid: string;
  name: string;
  lastName: string;
  email: string;
  phone?: string;
  institutionId: string;
  role: string;
  photo_profile_path?: string;
  photo_cover_path?: string;
}

export interface CreateAdminUserDTO {
  email: string;
  password: string;
  name: string;
  lastName: string;
  phone?: string;
  roleId: number;
  institutionId: string;
}
