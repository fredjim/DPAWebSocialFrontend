import { AfterViewInit, Component, ElementRef, OnInit, signal, ViewChild } from '@angular/core';
import { PostService } from '../../services/post.service';
import { Modal } from 'bootstrap';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { concatMap, of, map, catchError, reduce, tap, concat } from 'rxjs';
import { UploadedMedia } from '../../models/uploaded-media';
import { CreatePost } from '../../models/create-post';
import { Institution } from '../../models/institution';
import moment from 'moment';
import { CommentConfig } from '../../models/comment-config';
import { FbUploadedMedia } from '../../models/fb-uploaded-media';
import { TenantService } from '../../../services/tenant.service';
import { UserDetail } from '../../models/user-detail';
import imageCompression from 'browser-image-compression';

@Component({
  selector: 'app-create-post',
  templateUrl: './create-post.component.html',
  styleUrl: './create-post.component.scss'
})
export class CreatePostComponent implements OnInit, AfterViewInit {
  institution!: Institution;
  commentConfig!: CommentConfig[];
  selectedCommentConfig!: string;
  fbMediaResponse!: FbUploadedMedia;
  visibleAreaMedia = signal(false); //Mostrar seleccion y prevista de imagenes
  visibleAreaMediaDoc = signal(false); //Mostrar seleccion y prevista de documentos
  disableLoadImage = signal(false); //Deshabilitar el boton de cargar imagenes
  disableLoadDoc = signal(false); //Deshabilitar el boton de cargar documentos
  disabledPublishButton = signal(true); //Deshabilitar el boton de publicar
  postForm!: FormGroup;
  listFile!: File[];
  fileDoc!: File;
  isFbPosted!: boolean;
  isFbSwitchOn: boolean = false;
  currentUser!: UserDetail;
  currentPostType!: string;
  @ViewChild('modalCreatePost') modal!: ElementRef;
  public visibleModalCreate: boolean = false;

  constructor(
    private readonly postService: PostService,
    private readonly formBuilder: FormBuilder,
    private readonly tenantService: TenantService
  ) { }

  ngOnInit() {
    this.tenantService.getInstitution().subscribe({
      next: (institutionData: Institution) => {
        this.institution = institutionData;
      },
      error: (error) => {
        console.log(error);
      }
    });
    //Obtener la configuracion de comentarios
    this.postService.getCommentsConfiguration().subscribe({
      next: (commentsConfiguration: CommentConfig[]) => {
        this.commentConfig = commentsConfiguration;
        this.selectedCommentConfig = this.commentConfig[0].uuid;//Por defecto todos comentan
      },
      error: (error) => {
        console.log('Error al obtener la configuracion de comentarios', error)
      }
    })
    this.getTypeByRol()
    this.buildForm()
  }

  ngAfterViewInit(): void {
    this.modal.nativeElement.addEventListener('hidden.bs.modal', () => {
      this.visibleModalCreate = false;
      this.selectedCommentConfig = this.commentConfig[0].uuid;
      this.postForm.get('switchControl')?.setValue(false);
    });
  }

  private buildForm() {
    this.postForm = this.formBuilder.group({
      contentPost: ['', [Validators.maxLength(1000)]],
      media: [[]],
      mediaDoc: [[]],
      switchControl: [false]
    });
    // Optional: Listen to value changes
    this.postForm.get('switchControl')?.valueChanges.subscribe(value => {
      this.onSwitchChange(value);
    });
  }

  onSwitchChange(value: boolean) {
    this.isFbSwitchOn = value;
  }

  openModalCreatePost() {
    const modalElement = document.getElementById('modalCreatePost');
    if (modalElement) {
      const modal = new Modal(modalElement);
      modal.show();
      this.visibleModalCreate = true;
    }
  }

  //Deshabilitar el boton de publicar si no hay texto
  getTextPost(text: string) {
    this.postForm.get('contentPost')?.setValue(text);
    text === '' ? this.disabledPublishButton.set(true) : this.disabledPublishButton.set(false);
  }

  //Mostrar area de imagenes y deshabilitar el boton de cargar documentos
  showAreaMedia() {
    this.visibleAreaMedia.set(true);
    
    // Siempre deshabilitar la opción de documentos cuando se está trabajando con imágenes
    this.disableLoadDoc.set(true);
  }

  //Ocultar area de imagenes
  closeAreaMedia(option: boolean) {
    this.disableLoadDoc.set(option); //Habilitar el boton de cargar documentos
    
    // Actualizar estado del botón de publicar basado en el texto y la lista de archivos
    const contentPost = this.postForm.get('contentPost')?.value;
    const hasMedia = this.listFile && this.listFile.length > 0;
    this.disabledPublishButton.set(!(contentPost != '' || hasMedia));
    
    // Ya no limpiamos la lista de archivos para permitir acumular medios
  }

  //Actualizar la lista de archivos y habilitar/deshabilitar el botón de publicar
  getFilesImagesPost(fileMedia: File[]) {
    this.listFile = fileMedia;
    const contentPost = this.postForm.get('contentPost')?.value;
    // Habilitar el botón de publicar si hay texto o si hay archivos seleccionados
    this.disabledPublishButton.set(!(contentPost != '' || (this.listFile && this.listFile.length > 0)));
  }

  //Mostrar area de documentos y deshabilitar el boton de cargar imagenes
  showAreaDoc() {
    this.visibleAreaMediaDoc.set(true);
    this.disableLoadImage.set(true);
  }

  //Ocultar area de documentos
  closeAreaDoc(option: boolean) {
    this.disableLoadImage.set(option);
    const contentPost = this.postForm.get('contentPost')?.value;
    contentPost === '' ? this.disabledPublishButton.set(true) : this.disabledPublishButton.set(false);
    this.fileDoc = new File([''], '');//Limpiar el archivo
  }

  //Deshabilitar el boton de publicar si no hay archivo
  getFileDocPost(doc: File) {
    this.fileDoc = doc;
    const contentPost = this.postForm.get('contentPost')?.value;
    contentPost != '' || this.fileDoc ? this.disabledPublishButton.set(false) : this.disabledPublishButton.set(true);
  }

  showLoading() {
    document.getElementById('loadingBackdrop')!.style.display = 'flex';
  }

  hideLoading() {
    document.getElementById('loadingBackdrop')!.classList.add('hide');
  }

  getTypeByRol() {
    this.postService.getUser().subscribe({
      next:(user: UserDetail) => {
        this.currentUser = user;
        
        this.currentPostType = this.determinePostType(this.currentUser.role);
        
    },
    error:(error) => {
      console.error('Error al obtener el usuario actual', error);
      }
    });
   
  }

  private determinePostType(role: string): string {
    switch (role) {
      case 'ADMIN_BECAS':
        return 'BECAS';
      case 'ADMIN_CONVENIOS':
        return 'CONVENIOS';
      case 'ADMIN_PROYECTOS':
        return 'PROYECTOS';
      case 'ADMIN_CUDIE':
        return 'CUDIE'
      default:
        return 'GENERAL';
    }
  }

  private async optimizeImages(files: File[]): Promise<File[]> {
    const compressionOptions = {
      maxSizeMB: 1, // Máximo 1MB por imagen
      maxWidthOrHeight: 1920, // Resolución máxima
      useWebWorker: true, // No bloquear UI
      fileType: 'image/webp', // Convertir a WebP
      initialQuality: 0.8, // Calidad 80%
      alwaysKeepResolution: false,
      preserveExif: false
    };

    // Optimizar cada imagen en paralelo
    const optimizationPromises = files.map(async (file, index) => {
      if (!file.type.includes('image')) {
        return file; // Si no es imagen, devolver sin cambios
      }

      // Si ya es WebP y es pequeño, no optimizar
      if (file.type === 'image/webp' && file.size < 1024 * 500) { // < 500KB
        console.log(`Imagen ${file.name} ya es WebP y pequeña, omitiendo optimización`);
        return file;
      }

      try {
        // Optimizar la imagen
        const compressedFile = await imageCompression(file, compressionOptions);
        
        // Mantener el nombre original pero cambiar extensión a .webp
        const originalName = file.name.replace(/\.[^/.]+$/, "");
        const optimizedName = `${originalName}_optimized_${Date.now()}.webp`;
        
        return new File([compressedFile], optimizedName, {
          type: 'image/webp'
        });
        
      } catch (error) {
        console.warn(`No se pudo optimizar ${file.name}:`, error);
        return file; // Fallback al archivo original
      }
    });

    // Esperar a que todas se optimicen
    const results = await Promise.all(optimizationPromises);
    return results.filter((file): file is File => file !== null);
  }

  async post() {
    const valueFormPost = this.postForm.value;
    const formData = new FormData();
    const formDataFBdoc = new FormData();
    const post: CreatePost = {
      institution_id: this.institution.uuid,
      date: moment().format('YYYY-MM-DDTHH:mm:ss.SSS'),
      comment_config_id: this.selectedCommentConfig,
      post_type: this.currentPostType,
      content: {
        text: valueFormPost.contentPost.trim(),
        media: []
      },
      is_fb_posted: false,
      fb_post_enable: false
    }

    //Si hay info para postear
    if (valueFormPost.contentPost != '' || this.listFile || this.fileDoc) {

      this.showLoading();
      if (this.listFile && this.listFile.length > 0) { //Si hay imagenes-videos se los procesa
        
        try {
          // OPTIMIZAR IMÁGENES ANTES DE CREAR FORMDATA
          const optimizedFiles = await this.optimizeImages(this.listFile);
          
          // Reemplazar this.listFile con los archivos optimizados temporalmente
          const originalFiles = this.listFile; // Guardar originales para Facebook
          
          // Crear FormData con archivos optimizados
          Array.from(optimizedFiles).forEach((file) => {
            if (file.type.includes('image')) {
              formData.append('images', file);
            } else if (file.type.includes('video')) {
              formData.append('videos', file);
            }
          });
          
          let isVideo = false;
          this.postService.uploadMedia(formData).pipe(
            concatMap((uploadResponse: UploadedMedia[]) => {
              const processMedia$ = uploadResponse.map((media, index) => {

                const isImage = media.mimeType.includes('image');
                const baseMedia = {
                  number: index + 1,
                  type: media.mimeType,
                  name: media.name,
                  path: media.urlResource,
                  uploaded_file_uuid: media.uuid
                };

                if (!this.isFbSwitchOn) {
                  return of({
                    ...baseMedia,
                    fb_media_id: ''
                  });
                }

                const formDataFB = new FormData();
                // PARA FACEBOOK USAR EL ARCHIVO ORIGINAL, NO EL OPTIMIZADO
                formDataFB.append('source', originalFiles[index]);

                const uploadService$ = isImage
                  ? this.postService.uploadPhotoToFacebook(formDataFB)
                  : this.postService.publishVideoToFacebook(formDataFB, valueFormPost.contentPost);

                isVideo = !isImage;
                return uploadService$.pipe(
                  map(fbResponse => ({
                    ...baseMedia,
                    fb_media_id: fbResponse ? fbResponse.id : ''
                  })),
                  catchError(error => {
                    console.error(`Error uploading ${isImage ? 'photo' : 'video'} to Facebook`, error);
                    return of({
                      ...baseMedia,
                      fb_media_id: ''
                    });
                  })
                );
              });

              return concat(...processMedia$).pipe(
                reduce((acc: any[], media) => [...acc, media], []),
                tap((responseMedia) => {
                  this.isFbPosted = this.isFbSwitchOn &&
                    responseMedia.some(media => (media.fb_media_id != ''));
                }),
                concatMap(responseMedia => {
                  post.content.media = responseMedia;
                  post.is_fb_posted = isVideo;
                  post.fb_post_enable =  this.isFbSwitchOn;
                  return this.postService.createPost(post);
                })
              );
            })
          ).subscribe({
            next: (created) => {
              this.hideLoading();
              globalThis.location.reload();
            },
            error: (error) => {
              this.hideLoading();
              console.log('Error al crear el post con contenido media', error);
            }
          });

        } catch (optimizationError) {
          console.error('Error en optimización, usando archivos originales:', optimizationError);
          // Fallback a la lógica original
          this.processWithOriginalFilesFallback(post, valueFormPost);
        }

      } else if (this.fileDoc && this.fileDoc.size > 0) {//Si hay un archivo
        formData.append('file', this.fileDoc);
        formDataFBdoc.append('url', this.fileDoc);

        if (this.isFbSwitchOn) {
          //call uploadDocument
        }
        this.postService.uploadDocument(formData).pipe(
          concatMap((uploadResponse: UploadedMedia) => {
            // Initialize response object
            const responseDoc = {
              number: 1,
              type: 'document',//uploadResponse.mimeType,
              name: uploadResponse.name,
              path: uploadResponse.urlResource,
              uploaded_file_uuid: uploadResponse.uuid,
              fb_media_id: '',
              is_fb_posted: false
            };

            // Prepare the Facebook upload observable (only if switch is on)
            const facebookUpload$ = this.isFbSwitchOn
              ? this.postService.publishDocumentToFacebook(
                formDataFBdoc,
                valueFormPost.contentPost,
                uploadResponse.urlResource
              ).pipe(
                tap((fbDocument: FbUploadedMedia) => {
                  responseDoc.fb_media_id = fbDocument.id;
                  responseDoc.is_fb_posted = true;
                }),
                catchError(error => {
                  console.error('Error uploading document to Facebook', error);
                  return of(null); // Continue flow even if Facebook upload fails
                })
              )
              : of(null); // Skip if switch is off

            return facebookUpload$.pipe(
              concatMap(() => {
                // Ensure media array exists
                post.content.media = post.content.media || [];
                post.content.media.push(responseDoc);
                post.is_fb_posted = responseDoc.is_fb_posted;

                return this.postService.createPost(post);
              })
            );
          })

        ).subscribe({
          next: () => {
            this.hideLoading();
            globalThis.location.reload();
            
          },
          error: (error) => {
            this.hideLoading();
            console.log('Error al crear el post con archivo', error)
          }
        })

      } else if (valueFormPost.contentPost != '') {//Si solo tiene texto
        console.log("Publicando texto en opcion correcta: " + valueFormPost.contentPost )
        post.fb_post_enable = this.isFbSwitchOn;
        post.is_fb_posted = false;
        this.postService.createPost(post).subscribe({
          next: () => {
            this.hideLoading();
            globalThis.location.reload()
          },
          error: (error) => {
            this.hideLoading();
            console.log('Error al subir post solo texto', error)
          }
        })
      }
    } else {
      console.log('No hay datos para postear');
    }
  }

  private processWithOriginalFilesFallback(post: CreatePost, valueFormPost: any): void {
    const formData = new FormData();
    
    Array.from(this.listFile).forEach((file) => {
      if (file.type.includes('image')) {
        formData.append('images', file);
      } else if (file.type.includes('video')) {
        formData.append('videos', file);
      }
    });
    
    // Continuar con el flujo original usando this.listFile directamente
    let isVideo = false;
    this.postService.uploadMedia(formData).pipe(
      concatMap((uploadResponse: UploadedMedia[]) => {
        // Only process Facebook uploads if switch is on
        const processMedia$ = uploadResponse.map((media, index) => {
          const isImage = media.mimeType.includes('image');
          const baseMedia = {
            number: index + 1,
            type: media.mimeType,
            name: media.name,
            path: media.urlResource
          };

          // Skip Facebook upload if disabled
          if (!this.isFbSwitchOn) {
            return of({
              ...baseMedia,
              fb_media_id: ''
            });
          }

          const formDataFB = new FormData();
          formDataFB.append('source', this.listFile[index]);

          const uploadService$ = isImage
            ? this.postService.uploadPhotoToFacebook(formDataFB)
            : this.postService.publishVideoToFacebook(formDataFB, valueFormPost.contentPost);

          isVideo = !isImage;
          return uploadService$.pipe(
            
            map(fbResponse => ({
              ...baseMedia,
              fb_media_id: fbResponse ? fbResponse.id : ''
            })),
            catchError(error => {
              console.error(`Error uploading ${isImage ? 'photo' : 'video'} to Facebook`, error);
              return of({
                ...baseMedia,
                fb_media_id: ''
              });
            })
            
          );
          
        });

        // Process media sequentially instead of in parallel
        return concat(...processMedia$).pipe(
          reduce((acc: any[], media) => [...acc, media], []),
          tap((responseMedia) => {
            this.isFbPosted = this.isFbSwitchOn &&
              responseMedia.some(media => (media.fb_media_id != ''));
          }),
          concatMap(responseMedia => {
            post.content.media = responseMedia;
            post.is_fb_posted = isVideo;
            post.fb_post_enable =  this.isFbSwitchOn;
            return this.postService.createPost(post);
          })
        );
      })
    ).subscribe({
      next: () => {
        this.hideLoading();
        globalThis.location.reload()
      },
      error: (error) => {
        this.hideLoading();
        console.log('Error al crear el post con contenido media (imagenes y/o videos)', error)
      }
    });
  }
}
