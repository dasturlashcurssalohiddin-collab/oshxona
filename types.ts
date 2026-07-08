export interface MenuItem {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  image: string;
  stock: number;
  rating: number;
  voiceText: string;
}

export interface Booklet {
  active: boolean;
  title: string;
  pages: string[];
}

export interface Config {
  theme: 'light' | 'dark';
  backgroundType: 'color' | 'image' | 'gif' | 'video';
  backgroundValue: string;
  foregroundColor: string;
  logoUrl: string;
  logoWidth: number;
  effectsEnabled: boolean;
  activeLang: 'uz' | 'ru' | 'en';
}

export interface LogEntry {
  id?: string;
  time: string;
  action?: string;
  type?: string;
  user?: string;
}

export interface Stats {
  totalVisits: number;
  activeUsers: number;
  hourlyVisits: number[];
  dailyVisits: number[];
  monthlyVisits: number[];
  yearlyVisits: number[];
  ordersLog: LogEntry[];
  visitsLog: LogEntry[];
}

export interface Ad {
  id: string;
  active: boolean;
  position: 'top' | 'bottom' | 'popup' | 'sidebar';
  type: 'image' | 'video' | 'gif';
  contentUrl: string;
  linkUrl: string;
}

export interface Translations {
  welcome: string;
  menu: string;
  categories: string;
  search: string;
  settings: string;
  staffPanel: string;
  adminPanel: string;
  darkLight: string;
  details: string;
  stock: string;
  price: string;
  listen: string;
  exchange: string;
  add: string;
  delete: string;
  save: string;
  stats: string;
  logs: string;
  visitorStats: string;
  adSpace: string;
  password: string;
  enter: string;
  backToMenu: string;
  close: string;
}

export interface CrmState {
  menu: MenuItem[];
  booklet: Booklet;
  config: Config;
  languages: string[];
  translations: Record<string, Translations>;
  stats: Stats;
  ads: Ad[];
}
