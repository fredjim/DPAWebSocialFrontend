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
  enabled?: boolean;
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

export interface PaginatedResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}
