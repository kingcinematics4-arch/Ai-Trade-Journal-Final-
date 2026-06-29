import type { Locale } from '../config';

/**
 * Translation value type - can be a string or a nested object
 */
export type TranslationValue = string | TranslationObject;

/**
 * Translation object type - nested key-value pairs
 */
export interface TranslationObject {
  [key: string]: TranslationValue | any;
}

/**
 * Complete translation namespace for the entire application
 * This will be generated from the actual translation files
 */
export interface Translations {
  common: CommonTranslations;
  landing: LandingTranslations;
  dashboard: DashboardTranslations;
  auth: AuthTranslations;
  profile: ProfileTranslations;
  settings: SettingsTranslations;
  trading: TradingTranslations;
  analytics: AnalyticsTranslations;
  calendar: CalendarTranslations;
  strategies: StrategiesTranslations;
  ai: AiTranslations;
  errors: ErrorTranslations;
  validation: ValidationTranslations;
}

/**
 * Common translations used across the app
 */
export interface CommonTranslations {
  appName: string;
  loading: string;
  saving: string;
  saved: string;
  error: string;
  success: string;
  cancel: string;
  confirm: string;
  delete: string;
  edit: string;
  view: string;
  create: string;
  update: string;
  search: string;
  filter: string;
  sort: string;
  export: string;
  import: string;
  refresh: string;
  close: string;
  back: string;
  next: string;
  previous: string;
  submit: string;
  reset: string;
  clear: string;
  select: string;
  selectAll: string;
  deselectAll: string;
  noResults: string;
  noData: string;
  retry: string;
  or: string;
  and: string;
  yes: string;
  no: string;
  maybe: string;
  today: string;
  yesterday: string;
  tomorrow: string;
  thisWeek: string;
  thisMonth: string;
  thisYear: string;
  lastWeek: string;
  lastMonth: string;
  lastYear: string;
  custom: string;
  all: string;
  none: string;
  enabled: string;
  disabled: string;
  active: string;
  inactive: string;
  on: string;
  off: string;
  open: string;
  closed: string;
  pending: string;
  completed: string;
  inProgress: string;
  failed: string;
  total: string;
  average: string;
  count: string;
  percentage: string;
  currency: string;
  date: string;
  time: string;
  datetime: string;
  language: string;
  theme: string;
  darkMode: string;
  lightMode: string;
  system: string;
  settings: string;
  profile: string;
  logout: string;
  login: string;
  signup: string;
  signIn: string;
  signUp: string;
  signOut: string;
  email: string;
  password: string;
  username: string;
  fullName: string;
  rememberMe: string;
  forgotPassword: string;
  resetPassword: string;
  changePassword: string;
  confirmPassword: string;
  welcome: string;
  welcomeBack: string;
  goodMorning: string;
  goodAfternoon: string;
  goodEvening: string;
  goodNight: string;
}

/**
 * Landing page translations
 */
export interface LandingTranslations {
  hero: {
    title: string;
    subtitle: string;
    cta: string;
    secondaryCta: string;
  };
  features: {
    title: string;
    subtitle: string;
    items: Array<{
      title: string;
      description: string;
    }>;
  };
  testimonials: {
    title: string;
    subtitle: string;
    items: Array<{
      name: string;
      role: string;
      content: string;
    }>;
  };
  pricing: {
    title: string;
    subtitle: string;
    monthly: string;
    yearly: string;
    popular: string;
    choosePlan: string;
  };
  footer: {
    about: string;
    product: string;
    resources: string;
    legal: string;
    contact: string;
    privacy: string;
    terms: string;
    copyright: string;
  };
}

/**
 * Dashboard translations
 */
export interface DashboardTranslations {
  title: string;
  overview: string;
  statistics: string;
  recentActivity: string;
  quickActions: string;
  performance: string;
  portfolio: string;
  trades: string;
  pnl: string;
  winRate: string;
  totalTrades: string;
  averageWin: string;
  averageLoss: string;
  profitFactor: string;
  maxDrawdown: string;
  sharpeRatio: string;
  dailyPnl: string;
  weeklyPnl: string;
  monthlyPnl: string;
  yearlyPnl: string;
  openPositions: string;
  closedPositions: string;
  pendingOrders: string;
  tradeHistory: string;
  marketAnalysis: string;
  news: string;
  calendar: string;
  notes: string;
  goals: string;
  riskManagement: string;
  alerts: string;
  notifications: string;
  messages: string;
  aiInsights: string;
  recommendations: string;
  marketSentiment: string;
  volatility: string;
  trend: string;
  support: string;
  resistance: string;
}

/**
 * Authentication translations
 */
export interface AuthTranslations {
  login: {
    title: string;
    subtitle: string;
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    rememberMe: string;
    forgotPassword: string;
    submit: string;
    noAccount: string;
    signUp: string;
    orContinueWith: string;
    google: string;
    error: {
      invalidCredentials: string;
      emailRequired: string;
      passwordRequired: string;
      tooManyAttempts: string;
      accountLocked: string;
      emailNotVerified: string;
    };
  };
  signup: {
    title: string;
    subtitle: string;
    fullNameLabel: string;
    fullNamePlaceholder: string;
    usernameLabel: string;
    usernamePlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    confirmPasswordLabel: string;
    confirmPasswordPlaceholder: string;
    experienceLevelLabel: string;
    experienceLevelPlaceholder: string;
    tradingStyleLabel: string;
    tradingStylePlaceholder: string;
    countryLabel: string;
    countryPlaceholder: string;
    agreeToTerms: string;
    termsOfService: string;
    privacyPolicy: string;
    submit: string;
    hasAccount: string;
    signIn: string;
    orContinueWith: string;
    google: string;
    experienceLevels: {
      beginner: string;
      intermediate: string;
      advanced: string;
      professional: string;
    };
    tradingStyles: {
      dayTrading: string;
      swingTrading: string;
      positionTrading: string;
      scalping: string;
    };
    error: {
      emailTaken: string;
      usernameTaken: string;
      passwordTooWeak: string;
      passwordsDoNotMatch: string;
      termsRequired: string;
      invalidEmail: string;
    };
  };
  resetPassword: {
    title: string;
    subtitle: string;
    emailLabel: string;
    emailPlaceholder: string;
    submit: string;
    backToLogin: string;
    success: string;
    error: string;
  };
  verifyEmail: {
    title: string;
    subtitle: string;
    resend: string;
    success: string;
    error: string;
  };
}

/**
 * Profile translations
 */
export interface ProfileTranslations {
  title: string;
  edit: string;
  save: string;
  cancel: string;
  personalInfo: string;
  accountSettings: string;
  security: string;
  preferences: string;
  notifications: string;
  integrations: string;
  billing: string;
  dangerZone: string;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  location: string;
  bio: string;
  avatar: string;
  changeAvatar: string;
  removeAvatar: string;
  twoFactor: string;
  enable2fa: string;
  disable2fa: string;
  changePassword: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  deleteAccount: string;
  deleteAccountWarning: string;
  confirmDelete: string;
  success: {
    profileUpdated: string;
    passwordChanged: string;
    twoFactorEnabled: string;
    twoFactorDisabled: string;
  };
  error: {
    updateFailed: string;
    passwordChangeFailed: string;
    twoFactorFailed: string;
    deleteFailed: string;
  };
}

/**
 * Settings translations
 */
export interface SettingsTranslations {
  title: string;
  general: string;
  appearance: string;
  language: string;
  theme: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  numberFormat: string;
  currency: string;
  notifications: string;
  emailNotifications: string;
  pushNotifications: string;
  smsNotifications: string;
  tradeAlerts: string;
  priceAlerts: string;
  newsAlerts: string;
  systemAlerts: string;
  marketing: string;
  privacySettings: string;
  dataSharing: string;
  analytics: string;
  cookies: string;
  security: string;
  sessions: string;
  connectedDevices: string;
  loginHistory: string;
  apiKeys: string;
  webhooks: string;
  integrations: string;
  exchanges: string;
  brokers: string;
  calendars: string;
  storage: string;
  exportData: string;
  importData: string;
  backup: string;
  restore: string;
  about: string;
  version: string;
  terms: string;
  privacyPolicy: string;
  support: string;
  help: string;
  feedback: string;
  logout: string;
  logoutAllDevices: string;
}

/**
 * Trading translations
 */
export interface TradingTranslations {
  title: string;
  addTrade: string;
  editTrade: string;
  deleteTrade: string;
  viewTrade: string;
  tradeDetails: string;
  tradeInfo: string;
  entry: string;
  exit: string;
  symbol: string;
  type: string;
  side: string;
  long: string;
  short: string;
  quantity: string;
  price: string;
  entryPrice: string;
  exitPrice: string;
  stopLoss: string;
  takeProfit: string;
  pnl: string;
  fees: string;
  commission: string;
  date: string;
  time: string;
  duration: string;
  notes: string;
  tags: string;
  screenshots: string;
  media: string;
  psychology: string;
  emotions: string;
  confidence: string;
  discipline: string;
  patience: string;
  analysis: string;
  setup: string;
  strategy: string;
  timeframe: string;
  market: string;
  instrument: string;
  exchange: string;
  broker: string;
  account: string;
  risk: string;
  riskReward: string;
  positionSize: string;
  leverage: string;
  margin: string;
  status: string;
  open: string;
  closed: string;
  cancelled: string;
  pending: string;
  rejected: string;
  filled: string;
  partial: string;
  reason: string;
  lessons: string;
  improvements: string;
  mistakes: string;
  wins: string;
  losses: string;
  breakEven: string;
  winRate: string;
  profitFactor: string;
  averageWin: string;
  averageLoss: string;
  largestWin: string;
  largestLoss: string;
  maxDrawdown: string;
  maxRunup: string;
  sharpeRatio: string;
  sortinoRatio: string;
  calmarRatio: string;
  expectancy: string;
  totalReturn: string;
  annualizedReturn: string;
  monthlyReturn: string;
  weeklyReturn: string;
  dailyReturn: string;
}

/**
 * Analytics translations
 */
export interface AnalyticsTranslations {
  title: string;
  overview: string;
  performance: string;
  risk: string;
  patterns: string;
  insights: string;
  reports: string;
  export: string;
  dateRange: string;
  customRange: string;
  compare: string;
  breakdown: string;
  bySymbol: string;
  byStrategy: string;
  byTimeframe: string;
  byMarket: string;
  byDay: string;
  byHour: string;
  byMonth: string;
  heatmap: string;
  trends: string;
  correlations: string;
  distributions: string;
  statistics: string;
  advanced: string;
  metrics: string;
  kpis: string;
  charts: string;
  tables: string;
  summary: string;
  detailed: string;
  print: string;
  share: string;
  schedule: string;
  automated: string;
  realTime: string;
  historical: string;
  forecast: string;
  prediction: string;
  anomaly: string;
  outlier: string;
  benchmark: string;
  comparison: string;
  period: string;
  ytd: string;
  mtd: string;
  qtd: string;
  wtd: string;
  dtd: string;
}

/**
 * Calendar translations
 */
export interface CalendarTranslations {
  title: string;
  events: string;
  addEvent: string;
  editEvent: string;
  deleteEvent: string;
  viewEvent: string;
  eventDetails: string;
  eventTitle: string;
  description: string;
  date: string;
  time: string;
  duration: string;
  location: string;
  type: string;
  category: string;
  priority: string;
  status: string;
  reminder: string;
  recurrence: string;
  attendees: string;
  notes: string;
  links: string;
  attachments: string;
  tradeRelated: string;
  economic: string;
  earnings: string;
  dividend: string;
  split: string;
  ipo: string;
  conference: string;
  meeting: string;
  deadline: string;
  milestone: string;
  holiday: string;
  custom: string;
  day: string;
  week: string;
  month: string;
  year: string;
  agenda: string;
  today: string;
  previous: string;
  next: string;
  goTo: string;
}

/**
 * Strategies translations
 */
export interface StrategiesTranslations {
  title: string;
  myStrategies: string;
  addStrategy: string;
  editStrategy: string;
  deleteStrategy: string;
  viewStrategy: string;
  strategyDetails: string;
  name: string;
  description: string;
  type: string;
  timeframe: string;
  markets: string;
  instruments: string;
  riskManagement: string;
  entryRules: string;
  exitRules: string;
  positionSizing: string;
  stopLoss: string;
  takeProfit: string;
  trailingStop: string;
  performance: string;
  trades: string;
  winRate: string;
  profitFactor: string;
  expectancy: string;
  maxDrawdown: string;
  totalReturn: string;
  sharpeRatio: string;
  backtest: string;
  forwardTest: string;
  live: string;
  paper: string;
  active: string;
  inactive: string;
  archived: string;
  tags: string;
  notes: string;
  screenshots: string;
  journal: string;
  lessons: string;
  improvements: string;
  statistics: string;
  equityCurve: string;
  drawdownChart: string;
  monthlyReturns: string;
  tradeDistribution: string;
  winLossDistribution: string;
  timeDistribution: string;
  marketDistribution: string;
}

/**
 * AI Assistant translations
 */
export interface AiTranslations {
  title: string;
  assistant: string;
  chat: string;
  message: string;
  sendMessage: string;
  typing: string;
  online: string;
  offline: string;
  analyze: string;
  analyzeTrade: string;
  analyzePortfolio: string;
  analyzeMarket: string;
  getInsights: string;
  getRecommendations: string;
  askQuestion: string;
  explain: string;
  summarize: string;
  predict: string;
  forecast: string;
  optimize: string;
  improve: string;
  suggestions: string;
  tips: string;
  advice: string;
  warnings: string;
  alerts: string;
  patterns: string;
  opportunities: string;
  risks: string;
  sentiment: string;
  trend: string;
  momentum: string;
  volatility: string;
  liquidity: string;
  volume: string;
  price: string;
  support: string;
  resistance: string;
  breakout: string;
  reversal: string;
  continuation: string;
  consolidation: string;
  history: string;
  clearHistory: string;
  exportHistory: string;
  settings: string;
  preferences: string;
  model: string;
  temperature: string;
  maxTokens: string;
  systemPrompt: string;
  customInstructions: string;
}

/**
 * Error translations
 */
export interface ErrorTranslations {
  general: string;
  network: string;
  server: string;
  unauthorized: string;
  forbidden: string;
  notFound: string;
  methodNotAllowed: string;
  timeout: string;
  conflict: string;
  unprocessableEntity: string;
  tooManyRequests: string;
  internalServerError: string;
  serviceUnavailable: string;
  gatewayTimeout: string;
  unknown: string;
  validation: string;
  required: string;
  invalid: string;
  format: string;
  minLength: string;
  maxLength: string;
  pattern: string;
  email: string;
  url: string;
  date: string;
  number: string;
  integer: string;
  boolean: string;
  enum: string;
  array: string;
  object: string;
  file: string;
  image: string;
  video: string;
  audio: string;
  document: string;
  size: string;
  type: string;
  upload: string;
  download: string;
  save: string;
  delete: string;
  update: string;
  create: string;
  fetch: string;
  submit: string;
  cancel: string;
  retry: string;
  refresh: string;
  contactSupport: string;
  tryAgain: string;
  goBack: string;
  goHome: string;
}

/**
 * Validation translations
 */
export interface ValidationTranslations {
  required: string;
  email: string;
  url: string;
  minLength: string;
  maxLength: string;
  pattern: string;
  min: string;
  max: string;
  between: string;
  positive: string;
  negative: string;
  integer: string;
  number: string;
  date: string;
  future: string;
  past: string;
  age: string;
  password: string;
  confirmPassword: string;
  username: string;
  phone: string;
  zipCode: string;
  creditCard: string;
  ssn: string;
  taxId: string;
  company: string;
  firstName: string;
  lastName: string;
  fullName: string;
  address: string;
  city: string;
  state: string;
  country: string;
  currency: string;
  percentage: string;
  symbol: string;
  exchange: string;
  market: string;
  instrument: string;
  quantity: string;
  price: string;
  volume: string;
  leverage: string;
  margin: string;
  risk: string;
  reward: string;
  ratio: string;
}

/**
 * Translation namespace type
 */
export type TranslationNamespace = keyof Translations;

/**
 * Translation key path type
 */
export type TranslationKeyPath = string;

/**
 * Translation function type
 */
export type TFunction = (
  key: TranslationKeyPath,
  params?: Record<string, string | number>
) => string;

/**
 * I18n context type
 */
export interface I18nContext {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TFunction;
  isRtl: boolean;
  formatDate: (date: Date | string, options?: Intl.DateTimeFormatOptions) => string;
  formatNumber: (num: number, options?: Intl.NumberFormatOptions) => string;
  formatCurrency: (num: number, currency?: string) => string;
  formatPercent: (num: number, options?: Intl.NumberFormatOptions) => string;
  formatRelativeTime: (date: Date | string) => string;
}
