export type BlockButton = {
  button_group?: string | BlockButtonGroup | null
  id: string
  label?: string | null
  page?: string | Pages | null
  post?: string | Posts | null
  sort?: number | null
  type?: string | null
  url?: string | null
  variant?: string | null
}

export type UUID = string

export type BlockButtonGroup = {
  buttons: UUID[] | BlockButton[]
  id: string
  sort?: number | null
}

export type BlockCategories = {
  categories: UUID[] | BlockCategoriesCategories[]
  id: number
  sort?: number | null
}

export type BlockCategoriesCategories = {
  block_categories_id?: number | BlockCategories | null
  categories_id?: string | Category | null
  id: number
}

export type BlockForm = {
  form?: string | Forms | null
  id: string
}

export type BlockGallery = {
  id: string
  items: UUID[] | BlockGalleryItems[]
}

export type BlockGalleryItems = {
  block_gallery?: string | BlockGallery | null
  directus_file?: string | DirectusFiles | null
  id: string
  sort?: number | null
}

export type BlockHeading = {
  id: number
  sort?: number | null
  translations: UUID[] | BlockHeadingTranslations[]
}

export type BlockHeadingTranslations = {
  block_heading_id?: number | BlockHeading | null
  id: number
  languages_code?: string | Languages | null
  subtitle?: string | null
  title?: string | null
}

export type BlockHero = {
  id: string
  image?: string | DirectusFiles | null
  image_size_style?: string | null
  layout?: string | null
  translations: UUID[] | BlockHeroTranslations[]
}

export type BlockHeroTranslations = {
  block_hero_id?: string | BlockHero | null
  description?: string | null
  id: number
  languages_code?: string | Languages | null
  title?: string | null
}

export type BlockPosts = {
  id: string
  limit?: number | null
}

export type BlockRichtext = {
  id: number
  translations: UUID[] | BlockRichtextTranslations[]
}

export type BlockRichtextTranslations = {
  block_richtext_id?: number | BlockRichtext | null
  content?: string | null
  id: number
  languages_code?: string | Languages | null
}

export type BlockEmbed = {
  id: string
  embed_code?: string | null
}

export type BlockColumns = {
  id: string
  sort?: number | null
  size?: string | null
  blocks: number[] | BlockColumnsBlocks[]
  column_tree: number[] | BlockColumns[]
}

export type BlockColumnsBlocks = {
  id: string
  item?: string | BlockColumnsBlockItem | null
  collection?: string | null
  block_column_id?: string | BlockColumns | null
}

export type BlockColumnsBlockItem = BlockRichtext | BlockEmbed | BlockHero

export type Category = {
  id: string
  background?: string | DirectusFiles | null
  permalink?: string | null
  password?: string | null
  posts: UUID[] | CategoriesPosts[]
  sort?: number | null
  status: string
  translations: UUID[] | CategoriesTranslations[]
  blocks: UUID[] | CategoriesBlocks[]
}

export type CategoriesBlocks = {
  id: string
  item?: string | CategoryBlockItem | null
  collection?: string | null
  categories_id?: string | Category | null
}

export type CategoryBlockItem =
  | BlockRichtext
  | BlockEmbed
  | BlockHero
  | BlockColumns

export type CategoriesFiles = {
  categories_id?: string | null
  directus_files_id?: string | null
  id: number
}

export type CategoriesPosts = {
  categories_id?: string | Category | null
  id: number
  posts_id?: string | Posts | null
}

export type CategoriesTranslations = {
  categories_id?: string | Category | null
  id: number
  languages_code?: string | Languages | null
  name?: string | null
}

export type DirectusAccess = {
  id?: string | null
  policy: string | DirectusPolicies
  role?: string | DirectusRoles | null
  sort?: number | null
  user?: string | DirectusUsers | null
}

export type DirectusActivity = {
  action: string
  collection: string
  id: number
  ip?: string | null
  item: string
  origin?: string | null
  revisions: UUID[] | DirectusRevisions[]
  timestamp: string
  user?: string | DirectusUsers | null
  user_agent?: string | null
}

export type DirectusCollections = {
  accountability?: string | null
  archive_app_filter: boolean
  archive_field?: string | null
  archive_value?: string | null
  collapse: string
  collection: string
  color?: string | null
  display_template?: string | null
  group?: string | DirectusCollections | null
  hidden: boolean
  icon?: string | null
  item_duplication_fields?: unknown | null
  note?: string | null
  preview_url?: string | null
  singleton: boolean
  sort?: number | null
  sort_field?: string | null
  translations?: unknown | null
  unarchive_value?: string | null
  versioning: boolean
}

export type DirectusComments = {
  collection: string | DirectusCollections
  comment: string
  date_created?: string | null
  date_updated?: string | null
  id: string
  item: string
  user_created?: string | DirectusUsers | null
  user_updated?: string | DirectusUsers | null
}

export type DirectusDashboards = {
  color?: string | null
  date_created?: string | null
  icon: string
  id: string
  name: string
  note?: string | null
  panels: UUID[] | DirectusPanels[]
  user_created?: string | DirectusUsers | null
}

export type DirectusExtensions = {
  bundle?: string | null
  enabled: boolean
  folder: string
  id: string
  source: string
}

export type DirectusFields = {
  collection: string | DirectusCollections
  conditions?: unknown | null
  display?: string | null
  display_options?: unknown | null
  field: string
  group?: string | DirectusFields | null
  hidden: boolean
  id: number
  interface?: string | null
  note?: string | null
  options?: unknown | null
  readonly: boolean
  required?: boolean | null
  sort?: number | null
  special?: unknown | null
  translations?: unknown | null
  validation?: unknown | null
  validation_message?: string | null
  width?: string | null
}

export type DirectusFiles = {
  charset?: string | null
  created_on: string
  description?: string | null
  duration?: number | null
  embed?: string | null
  filename_disk?: string | null
  filename_download: string
  filesize?: number | null
  focal_point_x?: number | null
  focal_point_y?: number | null
  folder?: string | DirectusFolders | null
  height?: number | null
  id: string
  location?: string | null
  metadata?: unknown | null
  modified_by?: string | DirectusUsers | null
  modified_on: string
  storage: string
  tags?: unknown | null
  title?: string | null
  tus_data?: unknown | null
  tus_id?: string | null
  type?: string | null
  uploaded_by?: string | DirectusUsers | null
  uploaded_on?: string | null
  width?: number | null
}

export type DirectusFlows = {
  accountability?: string | null
  color?: string | null
  date_created?: string | null
  description?: string | null
  icon?: string | null
  id: string
  name: string
  operation?: string | DirectusOperations | null
  operations: UUID[] | DirectusOperations[]
  options?: unknown | null
  status: string
  trigger?: string | null
  user_created?: string | DirectusUsers | null
}

export type DirectusFolders = {
  id: string
  name: string
  parent?: string | DirectusFolders | null
}

export type DirectusMigrations = {
  name: string
  timestamp?: string | null
  version: string
}

export type DirectusNotifications = {
  collection?: string | null
  id: number
  item?: string | null
  message?: string | null
  recipient: string | DirectusUsers
  sender?: string | DirectusUsers | null
  status?: string | null
  subject: string
  timestamp?: string | null
}

export type DirectusOperations = {
  date_created?: string | null
  flow: string | DirectusFlows
  id: string
  key: string
  name?: string | null
  options?: unknown | null
  position_x: number
  position_y: number
  reject?: string | DirectusOperations | null
  resolve?: string | DirectusOperations | null
  type: string
  user_created?: string | DirectusUsers | null
}

export type DirectusPanels = {
  color?: string | null
  dashboard: string | DirectusDashboards
  date_created?: string | null
  height: number
  icon?: string | null
  id: string
  name?: string | null
  note?: string | null
  options?: unknown | null
  position_x: number
  position_y: number
  show_header: boolean
  type: string
  user_created?: string | DirectusUsers | null
  width: number
}

export type DirectusPermissions = {
  action: string
  collection: string
  fields?: unknown | null
  id: number
  permissions?: unknown | null
  policy: string | DirectusPolicies
  presets?: unknown | null
  validation?: unknown | null
}

export type DirectusPolicies = {
  admin_access: boolean
  app_access: boolean
  description?: string | null
  enforce_tfa: boolean
  icon: string
  id?: string | null
  ip_access?: unknown | null
  name: string
  permissions: UUID[] | DirectusPermissions[]
  roles: UUID[] | DirectusAccess[]
  users: UUID[] | DirectusAccess[]
}

export type DirectusPresets = {
  bookmark?: string | null
  collection?: string | null
  color?: string | null
  filter?: unknown | null
  icon?: string | null
  id: number
  layout?: string | null
  layout_options?: unknown | null
  layout_query?: unknown | null
  refresh_interval?: number | null
  role?: string | DirectusRoles | null
  search?: string | null
  user?: string | DirectusUsers | null
}

export type DirectusRelations = {
  id: number
  junction_field?: string | null
  many_collection: string
  many_field: string
  one_allowed_collections?: unknown | null
  one_collection?: string | null
  one_collection_field?: string | null
  one_deselect_action: string
  one_field?: string | null
  sort_field?: string | null
}

export type DirectusRevisions = {
  activity: number | DirectusActivity
  collection: string
  data?: unknown | null
  delta?: unknown | null
  id: number
  item: string
  parent?: number | DirectusRevisions | null
  version?: string | DirectusVersions | null
}

export type DirectusRoles = {
  children: UUID[] | DirectusRoles[]
  description?: string | null
  icon: string
  id: string
  name: string
  parent?: string | DirectusRoles | null
  policies: UUID[] | DirectusAccess[]
  users: UUID[] | DirectusUsers[]
  users_group: string
}

export type DirectusSessions = {
  expires: string
  ip?: string | null
  next_token?: string | null
  origin?: string | null
  share?: string | DirectusShares | null
  token: string
  user?: string | DirectusUsers | null
  user_agent?: string | null
}

export type DirectusSettings = {
  auth_login_attempts?: number | null
  auth_password_policy?: string | null
  basemaps?: unknown | null
  command_palette_settings?: unknown | null
  custom_aspect_ratios?: unknown | null
  custom_css?: string | null
  default_appearance: string
  default_language: string
  default_theme_dark?: string | null
  default_theme_light?: string | null
  id: number
  mapbox_key?: string | null
  module_bar?: unknown | null
  project_color: string
  project_descriptor?: string | null
  project_logo?: string | DirectusFiles | null
  project_name: string
  project_url?: string | null
  public_background?: string | DirectusFiles | null
  public_favicon?: string | DirectusFiles | null
  public_foreground?: string | DirectusFiles | null
  public_note?: string | null
  public_registration: boolean
  public_registration_email_filter?: unknown | null
  public_registration_role?: string | DirectusRoles | null
  public_registration_verify_email: boolean
  report_bug_url?: string | null
  report_error_url?: string | null
  report_feature_url?: string | null
  storage_asset_presets?: unknown | null
  storage_asset_transform?: string | null
  storage_default_folder?: string | DirectusFolders | null
  theme_dark_overrides?: unknown | null
  theme_light_overrides?: unknown | null
  theming_group: string
}

export type DirectusShares = {
  collection: string | DirectusCollections
  date_created?: string | null
  date_end?: string | null
  date_start?: string | null
  id: string
  item: string
  max_uses?: number | null
  name?: string | null
  password?: string | null
  role?: string | DirectusRoles | null
  times_used?: number | null
  user_created?: string | DirectusUsers | null
}

export type DirectusTranslations = {
  id: string
  key: string
  language: string
  value: string
}

export type DirectusUsers = {
  appearance?: string | null
  auth_data?: unknown | null
  avatar?: string | DirectusFiles | null
  description?: string | null
  email?: string | null
  email_notifications?: boolean | null
  external_identifier?: string | null
  first_name?: string | null
  id: string
  language?: string | null
  last_access?: string | null
  last_name?: string | null
  last_page?: string | null
  location?: string | null
  password?: string | null
  policies: UUID[] | DirectusAccess[]
  provider: string
  role?: string | DirectusRoles | null
  status: string
  tags?: unknown | null
  tfa_secret?: string | null
  theme_dark?: string | null
  theme_dark_overrides?: unknown | null
  theme_light?: string | null
  theme_light_overrides?: unknown | null
  title?: string | null
  token?: string | null
}

export type DirectusVersions = {
  collection: string | DirectusCollections
  date_created?: string | null
  date_updated?: string | null
  delta?: unknown | null
  hash?: string | null
  id: string
  item: string
  key: string
  name?: string | null
  user_created?: string | DirectusUsers | null
  user_updated?: string | DirectusUsers | null
}

export type DirectusWebhooks = {
  actions: unknown
  collections: unknown
  data: boolean
  headers?: unknown | null
  id: number
  method: string
  migrated_flow?: string | DirectusFlows | null
  name: string
  status: string
  url: string
  was_active_before_deprecation: boolean
}

export type FormFields = {
  choices?: unknown | null
  form?: string | Forms | null
  help?: string | null
  id: string
  label?: string | null
  name?: string | null
  placeholder?: string | null
  required?: boolean | null
  sort?: number | null
  type?: string | null
  validation?: string | null
  width?: string | null
}

export type FormSubmissionValues = {
  field?: string | FormFields | null
  file?: string | DirectusFiles | null
  form_submission?: string | FormSubmissions | null
  id: string
  sort?: number | null
  value?: string | null
}

export type FormSubmissions = {
  form?: string | Forms | null
  id: string
  meta_header_form_submissions: string
  timestamp?: string | null
  values: UUID[] | FormSubmissionValues[]
}

export type Forms = {
  emails?: unknown | null
  fields: UUID[] | FormFields[]
  id: string
  is_active?: boolean | null
  meta_emails: string
  meta_fields: string
  meta_header_forms: string
  meta_submissions: string
  meta_tabs: string
  on_success?: string | null
  sort?: number | null
  submissions: UUID[] | FormSubmissions[]
  submit_label?: string | null
  success_message?: string | null
  success_redirect_url?: string | null
  title?: string | null
}

export type Globals = {
  accent_color?: string | null
  favicon?: string | DirectusFiles | null
  id: string
  logo?: string | DirectusFiles | null
  logo_dark_mode?: string | DirectusFiles | null
  meta_header_globals: string
  social_links?: { url: string; icon: string; title: string }[] | null
  translations: UUID[] | GlobalsTranslations[]
}

export type GlobalsTranslations = {
  description?: string | null
  globals_id?: string | Globals | null
  id: number
  languages_code?: string | Languages | null
  title?: string | null
}

export type Languages = {
  code: string
  direction?: string | null
  name?: string | null
}

export type TranslationsCommon = {
  languages_code?: string | Languages | null
}

export type Menus = {
  id: string
  title?: string | null
  slug?: string | null
  items: UUID[] | NavigationItems[]
}

export type NavigationItems = {
  children: UUID[] | NavigationItems[]
  id: string
  navigation?: string | Menus | null
  page?: string | Pages | null
  parent?: string | NavigationItems | null
  post?: string | Posts | null
  sort?: number | null
  title?: string | null
  type?: string | null
  url?: string | null
}

export type PageBlocks = {
  background?: string | null
  collection?: string | null
  hide_block?: boolean | null
  id: string
  item?: string | PageBlockItem | null
  page?: string | Pages | null
  sort?: number | null
}

export type PageBlockItem =
  | BlockHero
  | BlockPosts
  | BlockRichtext
  | BlockEmbed
  | BlockColumns

export type Pages = {
  blocks: UUID[] | PageBlocks[]
  id: string
  meta_content: string
  meta_header_pages: string
  meta_m2a_button: string
  meta_seo: string
  meta_tabs: string
  permalink?: string | null
  published_at?: string | null
  seo?: unknown | null
  sort?: number | null
  status: string
  translations: UUID[] | PagesTranslations[]
  show_title?: "yes" | "no" | null
}

export type PagesTranslations = {
  id: number
  languages_code?: string | Languages | null
  pages_id?: string | Pages | null
  title?: string | null
}

export type Posts = {
  id: string
  image?: string | DirectusFiles | null
  meta_content: string
  meta_header_posts: string
  meta_seo: string
  meta_tabs: string
  protected: boolean
  published_at?: string | null
  seo?: unknown | null
  sort?: number | null
  status: string
  translations: UUID[] | PostsTranslations[]
  tags?: string | null
}

export type PostsTranslations = {
  content?: string | null
  description?: string | null
  id: number
  languages_code?: string | Languages | null
  posts_id?: string | Posts | null
  title?: string | null
  subtitle?: string | null
}

export type DBSchema = {
  categories: Category[]
  categories_files: CategoriesFiles[]
  categories_posts: CategoriesPosts[]
  categories_translations: CategoriesTranslations[]
  categories_blocks: CategoriesBlocks[]
  form_fields: FormFields[]
  form_submission_values: FormSubmissionValues[]
  form_submissions: FormSubmissions[]
  forms: Forms[]
  globals: Globals
  globals_translations: GlobalsTranslations[]
  languages: Languages[]
  menus: Menus[]
  navigation_items: NavigationItems[]
  page_blocks: PageBlocks[]
  pages: Pages[]
  pages_translations: PagesTranslations[]
  posts: Posts[]
  posts_translations: PostsTranslations[]

  /** Page Builder Blocks */
  block_button: BlockButton[]
  block_button_group: BlockButtonGroup[]
  block_categories: BlockCategories[]
  block_categories_categories: BlockCategoriesCategories[]
  block_hero: BlockHero[]
  block_hero_translations: BlockHeroTranslations[]
  block_posts: BlockPosts[]
  block_richtext: BlockRichtext[]
  block_richtext_translations: BlockRichtextTranslations[]
  block_embed: BlockEmbed[]
  block_columns: BlockColumns[]
  block_columns_blocks: BlockColumnsBlocks[]
  /** System collections */
  directus_access: DirectusAccess[]
  directus_activity: DirectusActivity[]
  directus_collections: DirectusCollections[]
  directus_comments: DirectusComments[]
  directus_dashboards: DirectusDashboards[]
  directus_extensions: DirectusExtensions[]
  directus_fields: DirectusFields[]
  directus_files: DirectusFiles[]
  directus_flows: DirectusFlows[]
  directus_folders: DirectusFolders[]
  directus_migrations: DirectusMigrations[]
  directus_notifications: DirectusNotifications[]
  directus_operations: DirectusOperations[]
  directus_panels: DirectusPanels[]
  directus_permissions: DirectusPermissions[]
  directus_policies: DirectusPolicies[]
  directus_presets: DirectusPresets[]
  directus_relations: DirectusRelations[]
  directus_revisions: DirectusRevisions[]
  directus_roles: DirectusRoles[]
  directus_sessions: DirectusSessions[]
  directus_settings: DirectusSettings
  directus_shares: DirectusShares[]
  directus_translations: DirectusTranslations[]
  directus_users: DirectusUsers[]
  directus_versions: DirectusVersions[]
  directus_webhooks: DirectusWebhooks[]
}
