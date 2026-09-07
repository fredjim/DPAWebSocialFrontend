// This file can be replaced during build by using the `file
// Replacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  //Institution
  INSTITUTION_ID: '93j203b4-f63b-4c4a-be05-eae84cef0c0c',

  //Tenant
  URL_BASE: 'http://localhost:4200',

  // Tenant fallback — solo para dev local (localhost sin subdominio real)
  DEFAULT_TENANT_SLUG: 'dpa',

  //Backend data
  production: false,
  // URLs canónicas — usar estas en código nuevo
  BACK_END_HOST: 'https://api.umss.dev/api/v1',
  BACK_END_HOST_AUTH: 'https://api.umss.dev/api/auth',
  // Aliases legacy — mantener para no romper servicios existentes
  BACK_END_HOST_DEV: 'https://api.umss.dev/api/v1',
  BACK_END_HOST_DEV_AUTH: 'https://api.umss.dev/api/auth',

};
/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
