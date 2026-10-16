export const environment = {
  production: true,
  DEFAULT_TENANT_SLUG: '',
  // URLs canónicas — usar estas en código nuevo
  BACK_END_HOST: 'https://api.umss.dev/api/v1',
  BACK_END_HOST_AUTH: 'https://api.umss.dev/api/auth',
  // Aliases legacy — mantener para no romper servicios existentes
  BACK_END_HOST_DEV: 'https://api.umss.dev/api/v1',
  BACK_END_HOST_DEV_AUTH: 'https://api.umss.dev/api/auth',
};
