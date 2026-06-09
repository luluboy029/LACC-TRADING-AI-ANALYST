export interface Candle {
  time: number; // timestamp in ms
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type StructuralBias = 'bullish' | 'bearish' | 'range';

export interface WeeklyAnalysis {
  weekly_bias: StructuralBias;
  confidence: string; // e.g. "85%"
  explanation: string;
}

export interface DailyAnalysis {
  daily_trend: StructuralBias;
  last_bos: 'up' | 'down' | 'none';
  strength: 'strong' | 'weak' | 'medium';
  last_choch_price?: number;
  last_mss_price?: number;
}

export interface Analysis4H {
  bias_4h: StructuralBias;
  liquidity: 'buyside' | 'sellside' | 'both' | 'none';
  expectation: 'continuation' | 'reversal' | 'ranging';
}

export interface Analysis1H {
  bias_1h: StructuralBias;
  is_mss: boolean;
  mss_type: 'bullish' | 'bearish' | 'none';
}

export interface Analysis15M {
  bias_15m: StructuralBias;
  last_sweep: string; // "buyside" or "sellside" or "none"
  fvg_found: boolean;
}

export interface Analysis5M {
  bias_5m: StructuralBias;
  current_state: string;
}

export interface LiquidityLevel {
  type: 'buyside' | 'sellside';
  name: 'Previous Day High' | 'Previous Day Low' | 'Previous Week High' | 'Previous Week Low' | 'Equal Highs' | 'Equal Lows' | 'Key Resistance' | 'Key Support';
  level: number;
  swept: boolean;
}

export interface SmartMoneySignal {
  mss: 'bullish' | 'bearish' | 'none';
  entry: 'confirmed' | 'pending' | 'none';
  fvgZone: string; // e.g. "63050 - 63120"
  chochPrice: number;
  bosPrice: number;
  mssPrice: number;
}

export interface SentimentBreakdown {
  sentiment: 'bullish' | 'bearish' | 'range';
  score: number; // 0 - 100 where higher means stronger sentiment of the state
  technical: number; // 0 - 100
  futures: number; // 0 - 100
  market: number; // 0 - 100 (Fear & Greed)
  news: number; // 0 - 100
  fearAndGreedValue: number;
  fearAndGreedLabel: string;
}

export interface AIBias {
  overall_bias: StructuralBias;
  confidence: string; // e.g. "88%"
  trade_direction: 'long' | 'short' | 'neutral';
  shortSummary: string;
}

export interface EntrySetup {
  entry: 'long' | 'short' | 'hold';
  entry_zone: string; // e.g. "63050-63120"
  stop_loss: string;
  target_tp1: string;
  target_tp2: string;
  rationale: string;
}

export interface EconomicCalendarItem {
  id: string;
  time: string;
  currency: 'USD' | 'EUR' | 'GBP' | 'ALL';
  event: string;
  importance: 'high' | 'medium' | 'low';
  actual: string;
  forecast: string;
  previous: string;
  impactColor: 'red' | 'orange' | 'yellow' | 'gray';
  url?: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  source: string;
  time: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  summary: string;
  url?: string;
}

export interface MarketReport {
  symbol: string;
  price: number;
  priceChange: number;
  weekly: WeeklyAnalysis;
  daily: DailyAnalysis;
  fourHour: Analysis4H;
  oneHour: Analysis1H;
  fifteenMin: Analysis15M;
  fiveMin: Analysis5M;
  liquidity: {
    target_liquidity: 'buyside' | 'sellside' | 'none';
    levels: LiquidityLevel[];
  };
  smartMoney: SmartMoneySignal;
  sentiment: SentimentBreakdown;
  aiBias: AIBias;
  entryEngine: EntrySetup;
  fundingRate: number;
  openInterest: number;
  cvdValue: number;
  candles?: Candle[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}
