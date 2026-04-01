export type MapStyle = 'parchment' | 'watercolor' | 'lineart';

export interface ArchitectLogEntry {
  concept: string;
  deduction: string;
}

export interface NarrativeAnchor {
  name: string;
  location: string;
  description: string;
}

export interface OCResidence {
  name: string;
  description: string;
}

export interface EcologyItem {
  name: string;
  location: string;
  description: string;
  type: 'flora' | 'fauna';
}

export interface TradeRoute {
  name: string;
  path: string;
  description: string;
  goods: string[];
}

export interface WorldData {
  worldOverview: string;
  architectLog: ArchitectLogEntry[];
  imagePrompt: string;
  narrativeAnchors: NarrativeAnchor[];
  ocResidence: OCResidence;
  epicIntro: string;
  ecology: EcologyItem[];
  tradeRoutes: TradeRoute[];
}

export interface ChronicleEra {
  id: string;
  eraName: string;
  eventDescription: string;
  worldData: WorldData;
  imageUrl: string;
}

export interface MapResult {
  worldData: WorldData;
  imageUrl: string;
}

export interface POVImage {
  id: string;
  name: string;
  imageUrl: string;
  timestamp: number;
}
