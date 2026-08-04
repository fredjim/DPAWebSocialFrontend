// This file can be replaced during build by using the `file
// Replacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  //Institution
  INSTITUTION_ID: '93j203b4-f63b-4c4a-be05-eae84cef0c0c',

  //Tenant
  URL_BASE: 'http://localhost:4200',

  // Tenant fallback (development)
  DEFAULT_TENANT_SLUG: 'dpa',

  //Backend data
  production: false,
  BACK_END_HOST_PROD: 'https://devpws.cs.umss.edu.bo/api/v1',
  /*BACK_END_HOST_DEV: 'http://dpa.umss.net/api/v1',*/
  BACK_END_HOST_DEV: 'http://localhost/api/v1',
  BACK_END_HOST_DEV_AUTH: 'http://localhost/api/auth',

};
/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
