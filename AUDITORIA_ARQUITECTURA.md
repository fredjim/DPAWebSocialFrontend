# AUDITORÍA TÉCNICA — DPA Web Social Frontend

**Angular 17 · PrimeNG 17 · TypeScript 5.4**  
*Arquitecto Frontend Senior — Análisis completo*  
*Fecha: 2026-05-10*

---

## RESUMEN GENERAL

El proyecto es una plataforma social institucional multi-tenant funcional con una base técnica sólida (interceptores bien estructurados, JWT lifecycle correcto, multi-tenancy vía header). Sin embargo, acumula **deuda técnica significativa** en tres frentes: arquitectura de módulos, design system fragmentado y un módulo `PostsModule` que actúa como monolito interno absorbiendo responsabilidades de 4-5 dominios distintos.

| Dimensión | Estado |
|---|---|
| Mantenibilidad | Media-baja — PostsModule con 27 componentes y 40+ métodos en un servicio |
| Escalabilidad | Media — Feature modules existen pero la separación de dominios es incompleta |
| Reutilización | Incipiente — SharedModule tiene 4 componentes pero el resto del código no los usa consistentemente |
| Coherencia visual | Baja — Dos sistemas de tokens paralelos, estilos globales que parchean PrimeNG |
| Performance | Media — Lazy loading incompleto, OnPush ausente en la mayoría de componentes |

**Riesgo principal**: `PostsModule` es el cuello de botella. Cualquier cambio en posts, comentarios, reacciones o medios tiene blast radius total sobre el módulo. Si el equipo crece, los conflictos de merge aquí serán constantes.

---

## PROBLEMAS CRÍTICOS

### P1 — `PostService` es un God Object (Crítico)

`src/app/posts/services/post.service.ts` contiene **40+ métodos** que cubren 7 dominios distintos:
- Posts CRUD
- Medios (imágenes, videos, documentos)
- Reacciones a posts
- Reacciones a comentarios
- Reacciones a replies
- Comentarios
- Integración Facebook

Esto viola SRP completamente. Un cambio en la API de reacciones requiere tocar el mismo archivo que gestiona uploads de PDF.

### P2 — `PostsModule` como monolito (Crítico)

27 componentes en un solo módulo, sin sub-módulos de feature. Incluye:
- Comentarios (deberían estar en `CommentsModule`)
- Galería de fotos/videos
- Editores de post
- Modales de reacciones
- Vistas por categoría (Convenios, Proyectos, Becas, CUDIE)

`CommentsModule` existe como módulo pero tiene 3 componentes y no tiene servicio propio — usa `PostService`. Es un módulo vacío de significado.

### P3 — Dos sistemas de tokens de diseño paralelos (Crítico)

En `styles.scss` conviven dos sets de CSS custom properties completamente inconexos:

**Sistema 1 (institucional — legacy)**:
```scss
--blue-color: #003770
--red-color: #E30613
--primary-font-family: "Montserrat"
```

**Sistema 2 (root dashboard — moderno)**:
```scss
--rd-primary: #1a1a2e
--rd-accent: #4f46e5
--rd-surface: #f8fafc
```

El prefijo `--rd-` sólo se usa en el dashboard de administración. El resto de la app usa `--blue-color` hardcodeado. Ninguno de los dos es el sistema real de PrimeNG. Resultado: 3 paletas de colores coexistiendo sin jerarquía.

### P4 — Interceptores mal organizados (Moderado)

`TenantInterceptor` y `AuthInterceptor` están dentro de `AuthenticationModule` (`authentication/http-interceptors/`). Los interceptores son infraestructura transversal de la app, no pertenecen a un feature module de autenticación. `TenantInterceptor` ni siquiera tiene relación semántica con auth.

### P5 — `AppModule` declara componentes de layout sin `CoreModule` (Moderado)

`AppModule` declara directamente: `HeaderComponent`, `HomeComponent`, `NavbarComponent`, `PagesComponent`, `EditInfoComponent`, `NavbarInformationComponent`, `HeroProfileComponent`, `SectionContainerComponent`, `FormSectionComponent`, `FormNavItemComponent`, `PageContainerComponent`.

Esto hace que `AppModule` sea un módulo de negocio y de infraestructura al mismo tiempo. Imposible de testear en aislamiento.

### P6 — Servicios de usuario duplicados en módulos distintos (Moderado)

Existen dos `UserService` con rutas distintas:
- `src/app/authentication/services/user.service.ts` — wraps `UserDatastoreService`, gestiona reset/enable/findById/changePassword
- `src/app/user-profile/services/user.service.ts` — gestiona foto de perfil y actualización de datos

Ambos hablan a `/users` endpoints. Un desarrollador nuevo no sabe cuál usar para qué.

### P7 — `PostService` importa datos de institución y usuario (Moderado)

`PostService` tiene métodos `getInstitution()`, `getUser()`, `getNumberFollowers()`. Un servicio de posts no debería saber nada de instituciones o usuarios. Esto crea acoplamiento implícito que dificulta mocking en tests.

### P8 — Estilos globales parchean PrimeNG en lugar de usar theming (Bajo-Moderado)

`styles.scss` contiene bloques como:
```scss
.p-datatable .p-datatable-header { ... }
.p-dialog .p-dialog-header { ... }
.p-toast .p-toast-message { ... }
```

Sobrescribir PrimeNG a nivel global con CSS es frágil: se rompe con cada upgrade de PrimeNG, es difícil de debuggear y no es testeable por componente. La solución correcta es usar el sistema de theming de PrimeNG (tokens de diseño de PrimeNG 17).

### P9 — Credenciales sensibles en `environment.ts` (Seguridad)

```typescript
FACEBOOK_PAGE_ACCESS_TOKEN: 'EAAGc...' // Token real expuesto
```

Un token de Facebook en el frontend significa que cualquier usuario puede inspeccionarlo en DevTools. Este token debe vivir exclusivamente en el backend.

### P10 — JWT en `localStorage` (Seguridad)

Vulnerable a XSS. Con el rico ecosistema de dependencias npm del proyecto (Quill, pdfjs, etc.), la superficie de ataque XSS es real.

---

## COMPONENTES A REFACTORIZAR

| Componente | Problema | Impacto | Solución |
|---|---|---|---|
| `PostService` | God Object, 40+ métodos, 7 dominios | Crítico | Dividir en `PostsApiService`, `ReactionsService`, `CommentsApiService`, `MediaUploadService`, `FacebookService` |
| `CreatePostComponent` | Gestiona texto + imágenes + videos + documentos + Facebook en un solo componente | Alto | Dividir en `PostEditorComponent` (orquestador) + `MediaUploaderComponent` + `DocumentUploaderComponent` |
| `CommentsModule` | Módulo sin servicio propio, sin lógica real. Sus componentes dependen de `PostService` | Alto | Crear `CommentsService` real o fusionar formalmente con `PostsModule` hasta que exista el servicio |
| `ViewAllPostsComponent` | Mezcla presentación + fetch + paginación + lógica de filtros | Alto | Separar en Container (lógica) + Presentational (lista de posts) |
| `ProfileComponent` | Upload de foto + edición de datos + validación todo en uno | Medio | Separar en sub-componentes de sección |
| `ProfileInstitutionComponent` | Idem — logo + background + datos en un componente | Medio | Separar en sub-componentes de sección |
| `AppModule` | Declara 11 componentes de layout + importa todos los feature modules | Crítico | Crear `CoreModule` + `LayoutModule` |
| `HomeComponent` | Componente raíz multi-tenant con routing de hijos — puede tener demasiada lógica | Medio | Auditar; separar lógica de resolución de tenant si existe |
| `InstitutionAvatarComponent` | En SharedModule pero probablemente acoplado al modelo de Institution del PostsModule | Medio | Desacoplar con interface propia en Shared |
| `CustomTableComponent` | Envuelve p-table — excelente, pero verificar que todos los módulos lo usen consistentemente | Bajo | Auditar uso; reemplazar uso directo de `p-table` fuera de shared |

---

## COMPONENTES NO UTILIZADOS / REDUNDANTES

Basado en la auditoría, los siguientes necesitan verificación de uso activo:

- **`CreateAccountComponent`** — Existe junto a `RegisterComponent`. ¿Son flujos distintos o duplicados?
- **`DepartmentDetailsComponent`** — En posts/components pero no aparece en el routing principal. Verificar si está activo.
- **`ChangePasswordComponent`** — En authentication/components. ¿Está enlazado desde el perfil de usuario?
- **`JwtDecodeService`** — Wrapper de una sola línea sobre `jwt-decode`. Eliminar; usar `jwt-decode` directamente o absorber en `AuthService`.
- **`UserDatastoreService`** — Solo existe para ser llamado por `user.service.ts` en authentication. Es una capa innecesaria; fusionar con `UserService`.

---

## NUEVA ESTRUCTURA RECOMENDADA

```
src/app/
│
├── core/                              # Singleton services, interceptors, guards
│   ├── core.module.ts
│   ├── interceptors/
│   │   ├── auth.interceptor.ts
│   │   ├── tenant.interceptor.ts
│   │   └── index.ts
│   ├── guards/
│   │   ├── auth.guard.ts
│   │   └── root.guard.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── tenant.service.ts
│   │   ├── institution-state.service.ts
│   │   └── user-core.service.ts       # único UserService unificado
│   └── models/
│       ├── user.model.ts
│       ├── institution.model.ts
│       └── auth.model.ts
│
├── shared/                            # Componentes reutilizables, pipes, directivas
│   ├── shared.module.ts
│   ├── components/
│   │   ├── ui-button/
│   │   ├── ui-input/                  # NUEVO — input wrapper
│   │   ├── ui-table/                  # Renombrado desde custom-table
│   │   ├── ui-dialog/                 # NUEVO — dialog wrapper
│   │   ├── ui-toast/                  # Renombrado desde custom-toast
│   │   ├── ui-badge/                  # NUEVO
│   │   ├── ui-avatar/                 # Renombrado desde institution-avatar + generalizado
│   │   ├── ui-empty-state/            # NUEVO
│   │   └── ui-loader/                 # NUEVO
│   ├── directives/
│   │   └── track-by.directive.ts
│   ├── pipes/
│   │   ├── time-ago.pipe.ts
│   │   └── truncate.pipe.ts
│   └── validators/
│       ├── only-letters.validator.ts
│       ├── password-match.validator.ts
│       └── password-length.validator.ts
│
├── layout/                            # Componentes de layout de la app principal
│   ├── layout.module.ts
│   ├── header/
│   ├── navbar/
│   ├── pages/
│   ├── page-container/
│   ├── section-container/
│   ├── form-section/
│   └── hero-profile/
│
├── features/
│   │
│   ├── authentication/                # Feature module — auth UI
│   │   ├── authentication.module.ts
│   │   ├── components/
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── forgot-password/
│   │   │   ├── reset-password/
│   │   │   ├── verify-email/
│   │   │   └── change-password/
│   │   └── (sin services aquí — en core/)
│   │
│   ├── posts/                         # Feature module — posts
│   │   ├── posts.module.ts
│   │   ├── posts-routing.module.ts
│   │   ├── components/
│   │   │   ├── post-feed/             # Container
│   │   │   ├── post-card/             # Presentational
│   │   │   ├── post-editor/           # Orquestador creación/edición
│   │   │   │   ├── text-editor/
│   │   │   │   ├── media-uploader/
│   │   │   │   └── document-uploader/
│   │   │   ├── post-options-menu/
│   │   │   └── post-reactions/
│   │   └── services/
│   │       ├── posts-api.service.ts   # Solo CRUD de posts
│   │       └── media-upload.service.ts
│   │
│   ├── comments/                      # Feature module — comentarios (real)
│   │   ├── comments.module.ts
│   │   ├── components/
│   │   │   ├── comment-list/
│   │   │   ├── comment-item/
│   │   │   ├── comment-input/
│   │   │   ├── reply-list/
│   │   │   ├── reply-item/
│   │   │   └── moderate-comments/
│   │   └── services/
│   │       └── comments-api.service.ts
│   │
│   ├── reactions/                     # Feature module — reacciones (transversal)
│   │   ├── reactions.module.ts
│   │   ├── components/
│   │   │   ├── reaction-picker/
│   │   │   ├── reaction-summary/
│   │   │   └── reaction-list-modal/
│   │   └── services/
│   │       └── reactions-api.service.ts
│   │
│   ├── gallery/                       # Feature module — galería
│   │   ├── gallery.module.ts
│   │   └── components/
│   │       ├── photos-gallery/
│   │       └── videos-gallery/
│   │
│   ├── user-profile/
│   │   ├── user-profile.module.ts
│   │   ├── components/
│   │   │   ├── profile-container/     # Container
│   │   │   ├── profile-info-form/     # Presentational
│   │   │   ├── profile-photo-upload/  # Presentational
│   │   │   └── change-password-form/
│   │   └── services/
│   │       └── user-profile-api.service.ts
│   │
│   ├── institution/
│   │   ├── institution.module.ts
│   │   ├── components/
│   │   │   ├── institution-profile-container/
│   │   │   ├── institution-info-form/
│   │   │   └── institution-media-upload/
│   │   └── services/
│   │       └── institution-api.service.ts
│   │
│   └── root-dashboard/                # Admin panel (ya bien aislado)
│       ├── root-dashboard.module.ts
│       ├── root-dashboard-routing.module.ts
│       ├── components/
│       │   ├── root-layout/
│       │   ├── root-login/
│       │   ├── institution-list/
│       │   ├── institution-detail/
│       │   ├── admin-users-table/
│       │   └── facebook-config/
│       ├── guards/
│       │   └── root.guard.ts
│       ├── models/
│       └── services/
│           ├── root-auth.service.ts
│           ├── institution-admin.service.ts
│           └── admin-user.service.ts
│
├── integrations/                      # Servicios de terceros aislados
│   └── facebook/
│       └── facebook-api.service.ts
│
├── app.component.ts
├── app.module.ts
└── app-routing.module.ts

src/
├── environments/
├── styles/
│   ├── _tokens.scss                   # ÚNICO source of truth de design tokens
│   ├── _typography.scss
│   ├── _spacing.scss
│   ├── _breakpoints.scss
│   └── _primeng-theme.scss            # Sobreescrituras de PrimeNG centralizadas
├── styles.scss                        # Solo imports de los partials
└── assets/
```

---

## DESIGN SYSTEM PROPUESTO

### Tokens de Diseño — `src/styles/_tokens.scss`

```scss
// ─── Paleta de color ───────────────────────────────────────────────────────
:root {
  // Brand (institucional UMSS/DPA)
  --color-brand-primary:    #003770;    // Azul UMSS
  --color-brand-secondary:  #E30613;    // Rojo UMSS
  --color-brand-accent:     #4f46e5;    // Indigo (dashboard moderno)

  // Neutrales
  --color-surface-base:     #f8fafc;
  --color-surface-raised:   #ffffff;
  --color-surface-overlay:  rgba(0, 0, 0, 0.4);

  // Bordes
  --color-border:           #e2e8f0;
  --color-border-subtle:    #f1f5f9;
  --color-border-focus:     #4f46e5;

  // Texto
  --color-text-primary:     #0f172a;
  --color-text-secondary:   #64748b;
  --color-text-muted:       #94a3b8;
  --color-text-inverse:     #ffffff;
  --color-text-brand:       #003770;

  // Semánticos
  --color-success:          #22c55e;
  --color-success-bg:       #f0fdf4;
  --color-warning:          #f59e0b;
  --color-warning-bg:       #fffbeb;
  --color-danger:           #ef4444;
  --color-danger-bg:        #fef2f2;
  --color-info:             #3b82f6;
  --color-info-bg:          #eff6ff;

  // ─── Tipografía ─────────────────────────────────────────────────────────
  --font-primary:   "Montserrat", sans-serif;    // Headings, brand
  --font-secondary: "Roboto", sans-serif;        // Body, UI
  --font-mono:      "Courier New", monospace;

  --text-xs:    0.75rem;    // 12px
  --text-sm:    0.875rem;   // 14px
  --text-base:  1rem;       // 16px
  --text-lg:    1.125rem;   // 18px
  --text-xl:    1.25rem;    // 20px
  --text-2xl:   1.5rem;     // 24px
  --text-3xl:   1.875rem;   // 30px

  --fw-regular:  400;
  --fw-medium:   500;
  --fw-semibold: 600;
  --fw-bold:     700;

  // ─── Espaciado ──────────────────────────────────────────────────────────
  --space-1:   0.25rem;   // 4px
  --space-2:   0.5rem;    // 8px
  --space-3:   0.75rem;   // 12px
  --space-4:   1rem;      // 16px
  --space-5:   1.25rem;   // 20px
  --space-6:   1.5rem;    // 24px
  --space-8:   2rem;      // 32px
  --space-10:  2.5rem;    // 40px
  --space-12:  3rem;      // 48px
  --space-16:  4rem;      // 64px

  // ─── Border radius ──────────────────────────────────────────────────────
  --radius-xs:  4px;
  --radius-sm:  8px;
  --radius-md:  12px;
  --radius-lg:  16px;
  --radius-xl:  24px;
  --radius-full: 9999px;

  // ─── Sombras ────────────────────────────────────────────────────────────
  --shadow-xs:  0 1px 2px rgba(0,0,0,0.05);
  --shadow-sm:  0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
  --shadow-md:  0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05);
  --shadow-lg:  0 10px 25px -5px rgba(0,0,0,0.06), 0 8px 10px -6px rgba(0,0,0,0.05);
  --shadow-xl:  0 20px 40px -10px rgba(0,0,0,0.08);

  // ─── Transiciones ───────────────────────────────────────────────────────
  --transition-fast:    100ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-normal:  200ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow:    300ms cubic-bezier(0.4, 0, 0.2, 1);

  // ─── Layout ─────────────────────────────────────────────────────────────
  --max-width-content:  1020px;
  --max-width-wide:     1440px;
}
```

### Componentes Base Obligatorios del Design System

| Componente | Estado actual | Acción |
|---|---|---|
| `UiButtonComponent` | Existe ✅ | Extender con variante `ghost` |
| `UiInputComponent` | No existe ❌ | Crear — wrapper de `p-inputtext` con label, error, hint |
| `UiTextareaComponent` | No existe ❌ | Crear |
| `UiSelectComponent` | No existe ❌ | Crear — wrapper de `p-dropdown` |
| `UiTableComponent` | Existe como `CustomTableComponent` ✅ | Renombrar, aplicar tokens |
| `UiDialogComponent` | No existe ❌ | Crear — wrapper de `p-dialog` |
| `UiToastComponent` | Existe como `CustomToastComponent` ✅ | Renombrar, aplicar tokens |
| `UiAvatarComponent` | Existe como `InstitutionAvatarComponent` | Generalizar para User + Institution |
| `UiBadgeComponent` | No existe ❌ | Crear |
| `UiEmptyStateComponent` | No existe ❌ | Crear |
| `UiSkeletonComponent` | No existe ❌ | Crear — loader de contenido |
| `UiCardComponent` | No existe ❌ | Crear |
| `UiConfirmDialogComponent` | No existe ❌ | Wrapper de `p-confirmDialog` |

---

## REUTILIZACIÓN

### Lo que debe reutilizarse y cómo

**1. Formularios de edición de perfil**

`ProfileComponent` e `ProfileInstitutionComponent` tienen el mismo patrón:
- Form con campos editables
- Upload de imagen con preview
- Submit con loading state
- Toast de éxito/error

Crear un `ProfilePhotoUploaderComponent` compartido en `SharedModule`.

**2. Vistas de feed por categoría**

Actualmente, `ViewAllPostsConveniosComponent`, `ViewAllPostsProyectosComponent`, `ViewAllPostsBecasComponent` y `ViewAllPostsCudieComponent` son 4 componentes que hacen exactamente lo mismo pero filtran por `postType` distinto.

**Solución**: Un único `PostFeedComponent` que reciba `@Input() postType`:

```typescript
// posts-routing.module.ts
{ path: 'convenios', component: PostFeedComponent, data: { postType: 'convenio' } },
{ path: 'proyectos', component: PostFeedComponent, data: { postType: 'proyecto' } },
{ path: 'becas',     component: PostFeedComponent, data: { postType: 'beca' } },
{ path: 'cudie',     component: PostFeedComponent, data: { postType: 'cudie' } },
```

**3. Modales de reacciones**

Existen 3 componentes distintos para listar usuarios que reaccionaron:
- `ModalListReactionsComponent` (posts)
- `ModalListReactionsCommentsComponent` (comentarios)
- `ModalListReactionsRepliesComponent` (replies)

Son el mismo modal con datos distintos. Un único `ReactionListModalComponent` con `@Input() reactions: ReactionsByUser[]` sirve para los tres casos.

**4. Pipes reutilizables**

Crear en `SharedModule`:

```typescript
// time-ago.pipe.ts — convierte moment a "hace 3 horas"
// truncate.pipe.ts — trunca texto con ellipsis
// file-size.pipe.ts — "1.2 MB"
```

**5. Directiva `trackBy` genérica**

```typescript
@Directive({ selector: '[trackByField]' })
export class TrackByFieldDirective {
  @Input() trackByField: string = 'id';
  trackBy = (index: number, item: any) => item[this.trackByField] ?? index;
}
```

---

## PERFORMANCE

### Problemas detectados

**1. `ChangeDetectionStrategy.OnPush` ausente en casi todos los componentes**

Solo `UiButtonComponent` tiene `OnPush`. Con 27+ componentes en `PostsModule`, cada cambio de estado dispara re-renders en toda la cadena.

**Acción**: Aplicar `OnPush` a todos los componentes presentacionales. Requiere usar `async pipe` en templates y evitar mutación directa de arrays/objetos.

**2. Lazy loading incompleto**

Solo `RootDashboardModule` está lazy-loaded. `PostsModule`, `CommentsModule`, `UserProfileModule`, `InstitutionModule` y `AuthenticationModule` se cargan en el bundle inicial.

**Acción**:
```typescript
// app-routing.module.ts
{
  path: ':slug',
  loadChildren: () => import('./features/posts/posts.module').then(m => m.PostsModule)
},
{
  path: 'profile',
  canActivate: [authGuard],
  loadChildren: () => import('./features/user-profile/user-profile.module').then(m => m.UserProfileModule)
},
```

**3. `trackBy` ausente en `*ngFor`**

Sin `trackBy`, Angular re-renderiza toda la lista de posts/comentarios en cada cambio. Con listas paginadas de feeds esto es visiblemente costoso.

**4. Suscripciones sin `takeUntilDestroyed`**

El interceptor usa el patrón `BehaviorSubject + filter + take(1)` correctamente, pero varios componentes probablemente suscriben sin cleanup.

**Acción**: Migrar a:
```typescript
private destroyRef = inject(DestroyRef);

this.service.getData()
  .pipe(takeUntilDestroyed(this.destroyRef))
  .subscribe(data => this.data = data);
```

**5. SharedModule re-exporta todos los módulos de PrimeNG**

Cualquier módulo que importe `SharedModule` carga TODOS los componentes de PrimeNG, incluso los que no usa.

**Acción**: En Angular 17, preferir imports directos de módulos PrimeNG en los módulos que los necesitan.

**6. Budget de 5MB en warning**

Con Bootstrap + PrimeNG + Quill + pdfjs + FontAwesome + ng-bootstrap, el bundle inicial ya está cerca del límite. La solución es lazy loading de features + separación de chunks.

---

## ESTÁNDARES Y CONVENCIONES

### Problemas detectados

| Área | Problema |
|---|---|
| Naming de servicios | `UserService` existe en 2 módulos distintos con APIs diferentes |
| Naming de componentes | `InstitutionAvatarComponent` debería ser `UiAvatarComponent` para ser shared |
| Naming de modelos | `comment.ts` usa `userId` (camelCase) mientras que `Post` usa `institution_id` (snake_case) |
| Barrel exports | Solo algunos módulos tienen `index.ts` de barrel |
| SCSS convenciones | Variables `--rd-*` solo se usan en root dashboard; no hay convención de prefijos clara |
| Separación de dominios | `PostService` hace fetch de Institution — viola la regla del dominio |

### Convenciones a establecer

```
Servicios HTTP:        feature-name-api.service.ts
Servicios de negocio:  feature-name.service.ts
Componentes UI Shared: ui-[nombre].component.ts
Modelos/Interfaces:    usar interfaces, sufijo .model.ts
CSS custom properties: --[categoria]-[propiedad] (sin prefijos de módulo)
Barrel exports:        index.ts en cada carpeta de components/services/models
```

---

## ROADMAP DE REFACTORIZACIÓN

### Fase 1 — Fundamentos (2-3 semanas)
*Sin tocar features existentes. Deuda técnica de infraestructura.*

- [ ] Crear `CoreModule` con interceptores, guards y servicios singleton
- [ ] Crear `LayoutModule` con Header, Navbar y componentes de layout
- [ ] Mover interceptores fuera de `AuthenticationModule`
- [ ] Unificar los dos `UserService` en `CoreModule`
- [ ] Eliminar `JwtDecodeService` (absorber en `AuthService`)
- [ ] Eliminar `UserDatastoreService` (fusionar en UserService unificado)
- [ ] Consolidar los dos sistemas de tokens CSS en `_tokens.scss`
- [ ] Documentar para backend: mover Facebook token fuera del frontend

### Fase 2 — Design System (2-3 semanas)
*Construir la librería interna de componentes. Sin tocar lógica de negocio.*

- [ ] Crear `UiInputComponent`, `UiSelectComponent`, `UiTextareaComponent`
- [ ] Crear `UiDialogComponent`, `UiCardComponent`, `UiBadgeComponent`
- [ ] Crear `UiAvatarComponent` (generalizar `InstitutionAvatarComponent`)
- [ ] Crear `UiEmptyStateComponent`, `UiSkeletonComponent`
- [ ] Renombrar `CustomTableComponent` → `UiTableComponent`
- [ ] Renombrar `CustomToastComponent` → `UiToastComponent`
- [ ] Mover sobreescrituras de PrimeNG a `_primeng-theme.scss`
- [ ] Aplicar tokens de diseño unificados a todos los componentes shared

### Fase 3 — División de Dominios (3-4 semanas)
*El trabajo más crítico. Requiere coordinación de equipo.*

- [ ] Dividir `PostService` en: `PostsApiService`, `CommentsApiService`, `ReactionsApiService`, `MediaUploadService`, `FacebookService`
- [ ] Crear `CommentsModule` real con `CommentsApiService` propio
- [ ] Crear `ReactionsModule` con `ReactionPickerComponent`, `ReactionSummaryComponent`, `ReactionListModalComponent`
- [ ] Unificar 5 componentes de feed por categoría en un único `PostFeedComponent`
- [ ] Separar `CreatePostComponent` en sub-componentes de editor
- [ ] Mover componentes de comentarios/replies de `PostsModule` a `CommentsModule`
- [ ] Aplicar `ChangeDetectionStrategy.OnPush` en todos los componentes presentacionales

### Fase 4 — Performance y Escalabilidad (2 semanas)
*Optimizaciones con el código ya limpio.*

- [ ] Activar lazy loading para todos los feature modules
- [ ] Añadir `trackBy` en todos los `*ngFor` sobre listas de datos
- [ ] Migrar suscripciones a `takeUntilDestroyed`
- [ ] Revisar y reducir imports de SharedModule
- [ ] Auditar bundle con `webpack-bundle-analyzer` y optimizar
- [ ] Implementar `preloadingStrategy` para módulos frecuentes post-login
- [ ] Añadir `ErrorBoundaryComponent` global

---

## SCORE FINAL DEL PROYECTO

| Dimensión | Score | Motivo principal |
|---|---|---|
| Arquitectura | 5.5/10 | Feature modules existen pero sin CoreModule ni separación real de dominios |
| Escalabilidad | 4.5/10 | PostsModule es el cuello de botella garantizado |
| Reutilización | 5.0/10 | UiButton y CustomTable son buenas señales pero no se usan consistentemente |
| Diseño / UI | 5.0/10 | Dos sistemas de tokens paralelos, sin Design System único |
| Performance | 4.0/10 | Sin lazy loading real, sin OnPush, sin trackBy |
| Mantenibilidad | 5.0/10 | God Object en PostService y servicios duplicados |
| Seguridad | 4.5/10 | JWT en localStorage + token Facebook expuesto en frontend |
| **SCORE GLOBAL** | **4.8/10** | Base sólida con deuda técnica significativa |

**Veredicto**: El proyecto tiene una base arquitectónica correcta — multi-tenancy bien implementado, interceptores con el patrón correcto, JWT lifecycle completo — pero ha crecido sin una segunda revisión arquitectónica. El 80% de la deuda técnica se concentra en `PostsModule` y la falta de un `CoreModule`. El Roadmap propuesto, ejecutado en orden, lleva el proyecto de 4.8 a ~8.0/10 sin reescrituras totales.
