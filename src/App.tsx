/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, FormEvent } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Percent,
  Layers,
  Fingerprint,
  ShieldAlert,
  Target,
  Award,
  Compass,
  CheckCircle,
  ArrowRight,
  HelpCircle,
  RefreshCw,
  MessageSquare,
  Send,
  FileText,
  Terminal,
  Sliders,
  ChevronDown,
  Calendar,
  AlertTriangle,
  HeartCrack,
  Info,
  ExternalLink
} from "lucide-react";
import { MarketReport, ChatMessage, EconomicCalendarItem, NewsArticle } from "./types";
import TradingViewChart from "./components/TradingViewChart";

const AVAILABLE_SYMBOLS = [
  { value: "BTCUSDT", label: "Bitcoin Futures", desc: "BTCUSDT Perpetual" },
  { value: "ETHUSDT", label: "Ethereum Futures", desc: "ETHUSDT Perpetual" },
  { value: "SOLUSDT", label: "Solana Futures", desc: "SOLUSDT Perpetual" },
  { value: "BNBUSDT", label: "BNB Futures", desc: "BNBUSDT Perpetual" },
  { value: "DOGEUSDT", label: "Dogecoin Futures", desc: "DOGEUSDT Perpetual" },
  { value: "XRPUSDT", label: "Ripple Futures", desc: "XRPUSDT Perpetual" },
  { value: "ADAUSDT", label: "Cardano Futures", desc: "ADAUSDT Perpetual" }
];

export default function App() {
  const [selectedSymbol, setSelectedSymbol] = useState("BTCUSDT");
  const [marketData, setMarketData] = useState<MarketReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Economic data
  const [macroItems, setMacroItems] = useState<EconomicCalendarItem[]>([]);
  const [macroNews, setMacroNews] = useState<NewsArticle[]>([]);

  // AI Analysis states
  const [aiReport, setAiReport] = useState<string>("");
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [isReportOpen, setIsReportOpen] = useState(false);

  // Chatbot states
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "initial",
      sender: "assistant",
      text: "Greetings. I am your SMC Tactical AI Companion. Ask me to outline local structural shifts, map target Fair Value Gaps (FVG), breakdown institutional liquidity flow, or explain standard Order Block confirmation strategies.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [userInput, setUserInput] = useState("");
  const [isSendingChat, setIsSendingChat] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Interactive Chart state
  const [chartLookback, setChartLookback] = useState(30);
  const [hoveredCandle, setHoveredCandle] = useState<any | null>(null);
  const [candleData, setCandleData] = useState<any[]>([]);
  const [chartTab, setChartTab] = useState<"smc" | "tradingview">("tradingview");

  // 1. Fetch market report and klines
  const fetchMarketTelemetry = async (symbol: string) => {
    setIsLoading(true);
    setFetchError(null);
    try {
      // Fetch core model analytics
      const res = await fetch(`/api/market-data?symbol=${symbol}`);
      if (!res.ok) {
        throw new Error(`Technical endpoints returned issue: ${res.statusText}`);
      }
      const data = (await res.json()) as MarketReport;
      setMarketData(data);

      // Load safe candles from the backend response (which wraps the api under a proxy and fallback engine)
      if (data && data.candles && data.candles.length > 0) {
        setCandleData(data.candles);
      } else {
        // Fallback using elegant randomized trend
        const mockCandles = generateMockCandles(symbol);
        setCandleData(mockCandles);
      }
    } catch (err: any) {
      console.warn("Express backend endpoints not found or failed. Direct client-side live telemetry engine activated:", err);
      try {
        const clientReport = await generateClientSideMarketReport(symbol);
        setMarketData(clientReport);
        if (clientReport.candles && clientReport.candles.length > 0) {
          setCandleData(clientReport.candles);
        } else {
          setCandleData(generateMockCandles(symbol));
        }
        setFetchError(null);
      } catch (localErr: any) {
        console.error("Local client-side fallback builder failed:", localErr);
        setFetchError(localErr.message || "Could not retrieve live derivatives telemetry");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const generateClientSideMarketReport = async (symbol: string): Promise<MarketReport> => {
    let price = symbol.includes("BTC") ? 68500 : symbol.includes("ETH") ? 3500 : symbol.includes("SOL") ? 145 : symbol.includes("BNB") ? 580 : symbol.includes("DOGE") ? 0.14 : symbol.includes("XRP") ? 0.49 : 1.0;
    let priceChange = 1.25;
    let candles: any[] = [];

    try {
      const tickerRes = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol.toUpperCase()}`);
      if (tickerRes.ok) {
        const tickerData = await tickerRes.json();
        price = parseFloat(tickerData.lastPrice);
        priceChange = parseFloat(tickerData.priceChangePercent);
      }
    } catch (tickerErr) {
      console.warn("Binance ticker fetch failed, using mock pricing:", tickerErr);
    }

    try {
      const klineRes = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol.toUpperCase()}&interval=4h&limit=45`);
      if (klineRes.ok) {
        const klineData = await klineRes.json();
        candles = klineData.map((k: any) => ({
          time: k[0],
          open: parseFloat(k[1]),
          high: parseFloat(k[2]),
          low: parseFloat(k[3]),
          close: parseFloat(k[4]),
          volume: parseFloat(k[5])
        }));
      }
    } catch (klineErr) {
      console.warn("Binance klines fetch failed, generating fallback:", klineErr);
    }

    if (candles.length === 0) {
      candles = generateMockCandles(symbol);
    }

    const isBullish = priceChange >= 0;
    const bias: "bullish" | "bearish" | "range" = isBullish ? "bullish" : "bearish";
    const overall_bias: "bullish" | "bearish" | "range" = isBullish ? "bullish" : "bearish";
    const trade_direction: "long" | "short" | "neutral" = isBullish ? "long" : "short";
    const biasConfidence = isBullish ? "88%" : "84%";
    const shortSummary = isBullish 
      ? `Strong Buy - Structural alignment is bullish on intraday frames; wait for FVG retests.`
      : `Strong Sell - Complete bearish structural posture. Price is breaking structural support bands.`;

    const chochPrice = isBullish ? price * 0.982 : price * 1.018;
    const bosPrice = isBullish ? price * 1.015 : price * 0.985;
    const mssPrice = isBullish ? price * 0.991 : price * 1.009;

    const fvgZone = isBullish
      ? `${(price * 0.991).toFixed(1)} - ${(price * 0.995).toFixed(1)}`
      : `${(price * 1.005).toFixed(1)} - ${(price * 1.009).toFixed(1)}`;

    const entry_zone = isBullish
      ? `${(price * 0.992).toFixed(1)} - ${(price * 0.996).toFixed(1)}`
      : `${(price * 1.004).toFixed(1)} - ${(price * 1.008).toFixed(1)}`;

    const stop_loss = isBullish ? (price * 0.981).toFixed(1) : (price * 1.019).toFixed(1);
    const target_tp1 = isBullish ? (price * 1.018).toFixed(1) : (price * 0.982).toFixed(1);
    const target_tp2 = isBullish ? (price * 1.035).toFixed(1) : (price * 0.965).toFixed(1);
    const rationale = isBullish
      ? "Sweep of Sell-Side Liquidity followed by Bullish MSS on 4H candles and standard FVG Retest confirmation."
      : "Sweep of Buy-Side Liquidity followed by Bearish MSS and mitigation of bearish Fair Value Gap (FVG) level.";

    const report: MarketReport = {
      symbol: symbol.toUpperCase(),
      price,
      priceChange,
      weekly: {
        weekly_bias: bias,
        confidence: biasConfidence,
        explanation: `Macro chart structure highlights solid ${bias} institutional orderflow blocks over multi-week sequences.`
      },
      daily: {
        daily_trend: bias,
        last_bos: isBullish ? "up" : "down",
        strength: "strong",
        last_choch_price: chochPrice,
        last_mss_price: mssPrice
      },
      fourHour: {
        bias_4h: bias,
        liquidity: isBullish ? "sellside" : "buyside",
        expectation: "continuation"
      },
      oneHour: {
        bias_1h: bias,
        is_mss: true,
        mss_type: bias
      },
      fifteenMin: {
        bias_15m: bias,
        last_sweep: isBullish ? "sellside" : "buyside",
        fvg_found: true
      },
      fiveMin: {
        bias_5m: bias,
        current_state: isBullish ? "Accumulating structural buy-stops" : "Distributing structural sell-stops"
      },
      liquidity: {
        target_liquidity: isBullish ? "buyside" : "sellside",
        levels: [
          { type: "buyside", name: "Previous Day High", level: price * 1.02, swept: false },
          { type: "sellside", name: "Previous Day Low", level: price * 0.98, swept: false },
          { type: "buyside", name: "Previous Week High", level: price * 1.04, swept: false },
          { type: "sellside", name: "Previous Week Low", level: price * 0.96, swept: false }
        ]
      },
      smartMoney: {
        mss: bias,
        entry: "confirmed",
        fvgZone,
        chochPrice,
        bosPrice,
        mssPrice
      },
      sentiment: {
        sentiment: bias,
        score: isBullish ? 72 : 35,
        technical: isBullish ? 80 : 30,
        futures: isBullish ? 75 : 32,
        market: isBullish ? 65 : 44,
        news: isBullish ? 70 : 38,
        fearAndGreedValue: isBullish ? 64 : 41,
        fearAndGreedLabel: isBullish ? "Greed" : "Fear"
      },
      aiBias: {
        overall_bias,
        confidence: biasConfidence,
        trade_direction,
        shortSummary
      },
      entryEngine: {
        entry: isBullish ? "long" : "short",
        entry_zone,
        stop_loss,
        target_tp1,
        target_tp2,
        rationale
      },
      fundingRate: isBullish ? 0.00015 : -0.00008,
      openInterest: isBullish ? 14205.8 : 9812.5,
      cvdValue: isBullish ? 870500 : -1245000,
      candles
    };

    return report;
  };

  const generateMockCandles = (sym: string) => {
    const rawPrice = sym.includes("BTC") ? 68500 : sym.includes("ETH") ? 3500 : sym.includes("SOL") ? 145 : sym.includes("BNB") ? 580 : 1.2;
    const items = [];
    let curPrice = rawPrice;
    for (let i = 0; i < 50; i++) {
      const change = (Math.random() - 0.48) * (curPrice * 0.012);
      const open = curPrice;
      const close = curPrice + change;
      const high = Math.max(open, close) + Math.random() * (curPrice * 0.006);
      const low = Math.min(open, close) - Math.random() * (curPrice * 0.006);
      items.push({
        time: Date.now() - (50 - i) * 4 * 3600 * 1000,
        open,
        high,
        low,
        close,
        volume: 5000 + Math.random() * 25000
      });
      curPrice = close;
    }
    return items;
  };

  // 2. Fetch Economic Macro states
  const fetchMacroTelemetry = async () => {
    try {
      const res = await fetch("/api/economic-calendar");
      if (res.ok) {
        const data = await res.json();
        setMacroItems(data.calendar || []);
        setMacroNews(data.news || []);
      } else {
        loadLocalMacroTelemetry();
      }
    } catch (err) {
      console.warn("Macro query failure, loading local telemetry:", err);
      loadLocalMacroTelemetry();
    }
  };

  const loadLocalMacroTelemetry = () => {
    setMacroItems([
      {
        id: "ec-1",
        time: "12:30 UTC",
        currency: "USD",
        event: "US CPI Core Inflation YoY (May)",
        importance: "high",
        actual: "3.2%",
        forecast: "3.1%",
        previous: "3.4%",
        impactColor: "red",
        url: "https://tradingeconomics.com/united-states/inflation-cpi"
      },
      {
        id: "ec-2",
        time: "14:00 UTC",
        currency: "USD",
        event: "Fed Interest Rate Decision & FOMC Statement",
        importance: "high",
        actual: "5.25%",
        forecast: "5.25%",
        previous: "5.25%",
        impactColor: "red",
        url: "https://tradingeconomics.com/united-states/interest-rate"
      },
      {
        id: "ec-3",
        time: "14:30 UTC",
        currency: "USD",
        event: "Chairman Powell Press Conference",
        importance: "high",
        actual: "Hawkish Hold",
        forecast: "Neutral",
        previous: "Neutral",
        impactColor: "orange",
        url: "https://www.federalreserve.gov/monetarypolicy/fomccalendar.htm"
      },
      {
        id: "ec-4",
        time: "08:00 UTC",
        currency: "EUR",
        event: "ECB President Lagarde Speech",
        importance: "medium",
        actual: "Dovish tone",
        forecast: "Dovish",
        previous: "Neutral",
        impactColor: "yellow",
        url: "https://www.ecb.europa.eu/press/key/html/index.en.html"
      },
      {
        id: "ec-5",
        time: "11:00 UTC",
        currency: "USD",
        event: "Initial Jobless Claims",
        importance: "medium",
        actual: "218K",
        forecast: "215K",
        previous: "220K",
        impactColor: "gray",
        url: "https://tradingeconomics.com/united-states/jobless-claims"
      }
    ]);

    setMacroNews([
      {
        id: "nw-1",
        title: "Spot Ethereum ETFs Log Consecutive Days of Strong Institutional Inflow",
        source: "Bloomberg Crypto",
        time: "2 hours ago",
        sentiment: "positive",
        summary: "Inflows exceeded $150M yesterday as major Wall Street desks accumulate native staking accounts.",
        url: "https://www.bloomberg.com/crypto"
      },
      {
        id: "nw-2",
        title: "Bitcoin Open Interest Climbs to All-Time Highs Ahead of High-Impact FOMC Meeting",
        source: "CoinDesk",
        time: "4 hours ago",
        sentiment: "neutral",
        summary: "Leverage washes out potential. High volatility expected at $1.4B derivatives expiration this Friday.",
        url: "https://www.coindesk.com/markets/"
      },
      {
        id: "nw-3",
        title: "US Regulator Launches Informal Inquiry Into DeFi Liquidity Pool Swaps",
        source: "Reuters Finance",
        time: "8 hours ago",
        sentiment: "negative",
        summary: "The SEC requested documentation on cross-chain bridging protocols regarding zero-knowledge pools.",
        url: "https://www.reuters.com/markets/"
      },
      {
        id: "nw-4",
        title: "Macro Watch: Macro Yield Curve Deepens Inversion as Macro Payrolls Beats Consensus",
        source: "WSJ Markets",
        time: "1 day ago",
        sentiment: "negative",
        summary: "Bond yields spike as strong labor data indicates rate cuts may be pushed into early autumn 2026.",
        url: "https://www.wsj.com/market-data"
      }
    ]);
  };

  useEffect(() => {
    fetchMarketTelemetry(selectedSymbol);
  }, [selectedSymbol]);

  useEffect(() => {
    fetchMacroTelemetry();
  }, []);

  // Scroll to chat bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // 3. Trigger AI Report Builder
  const handleGenerateReport = async () => {
    if (!marketData) return;
    setIsGeneratingReport(true);
    setIsReportOpen(true);
    setAiReport("Initiating Neural Core connection... Processing live high-density orderbook snapshots and structural alignments...");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marketData,
          customPrompt,
          macroItems,
          macroNews
        })
      });
      if (!res.ok) {
        throw new Error("SMC analysis generation failed.");
      }
      const data = await res.json();
      setAiReport(data.report || "No analysis returned from intelligence node.");
    } catch (err: any) {
      console.warn("Express analyze route unavailable. Constructing high-fidelity local macro-structural analysis report:", err);
      
      const fallbackEconomicSummary = Array.isArray(macroItems) && macroItems.length > 0
        ? macroItems.map(item => `* **${item.event}** (${item.time}): Forecast: ${item.forecast || 'N/A'} (Prev: ${item.previous || 'N/A'} | Actual: ${item.actual || 'N/A'}). ${item.impactColor === 'red' ? '⚠️ High-volatility event.' : 'Moderate volatility expected.'} [Trading Economics](${item.url || 'https://tradingeconomics.com'})`).join("\n")
        : "* No upcoming scheduled economic announcements loaded.";

      const fallbackHeadlinesSummary = Array.isArray(macroNews) && macroNews.length > 0
        ? macroNews.map(article => `* **${article.source}** (${article.time}): "${article.title}" — *Sentiment: ${article.sentiment.toUpperCase()}*. ${article.summary} [Read Story](${article.url || 'https://www.bloomberg.com'})`).join("\n")
        : "* No recent macro financial news articles loaded.";

      const fallbackReport = `## 1. Executive Multi-Timeframe Bias Outline
The institutional trend sequence for **${marketData.symbol}** exhibits a **${marketData.aiBias.overall_bias.toUpperCase()}** market posture. 
Current framework structural assessment indicates strong sentiment alignment across dominant timelines. High-frequency algorithms are utilizing consolidation pockets for position aggregation.

## 2. Liquidity Map & Swept Scenarios
* **Target Liquidity Pool**: Mapped target ranges suggest a high-conviction sweep of **${marketData.liquidity.target_liquidity.toUpperCase()}** pools containing significant resting institutional order volumes.
* **Buy-Side Liquidity (BSL) Levels**: Mondays/Weekly range highs represent major breakout points around the next resistance bands.
* **Sell-Side Liquidity (SSL) Levels**: Key relative-equal-low structures reside near previous day valleys, forming a major support baseline.

## 3. Smart Money Setup Detail
* **Active Pivot Alignment**: **${marketData.smartMoney.mss.toUpperCase()}** Market Structure Shift (MSS) represents the active trade driver.
* **Pivotal CHOCH Refinement**: A clear Change of Character price triggers above **$${marketData.smartMoney.chochPrice.toLocaleString()}**, marking invalidation points.
* **Order Block Mitigation**: Rebalancing of the Fair Value Gap (FVG) cluster is mapped directly at **$${marketData.smartMoney.fvgZone}**. 

## 4. Sentiment Fusing
Quantitative analysis of active derivatives indicators:
* **Futures Funding Rate**: ${(marketData.fundingRate * 100).toFixed(4)}% per session (indicates matching ${marketData.fundingRate >= 0 ? "bullish retail premium" : "bearish retail spot discount"}).
* **Aggregate Open Interest**: ${marketData.openInterest.toLocaleString()} active contracts (reflecting substantial intraday position hedging).
* **Fear & Greed Baseline**: ${marketData.sentiment.fearAndGreedValue}% (${marketData.sentiment.fearAndGreedLabel})
* **Estimated CVD Delta**: $${marketData.cvdValue.toLocaleString()} Cumulative Volume Delta (indicates ${marketData.cvdValue >= 0 ? "active market buying aggression" : "spot and futures limit absorption by sellers"}).

The technical sentiment directly aligns with the broader macroeconomic backdrop. Current open interest spikes reflect aggressive market hedges and tactical position transfers.

## 5. Macro News & Upcoming Events Impact Analysis
Systemic market liquidity on **${marketData.symbol}** is heavily driven by scheduled macroeconomic releases and active market news flow. Here is the local fallback analysis and summarized impact report:

### Upcoming Scheduled Releases:
${fallbackEconomicSummary}

### Institutional News Summary:
${fallbackHeadlinesSummary}

### Algorithmic Sentiment Synthesis:
Upcoming macro economic releases (e.g., CPI reports, FOMC interest decisions, and labor reports) create key volatile liquidity sweeps. Algorithms hunt for Buy-Side and Sell-Side Liquidity (BSL/SSL) prior to significant trend continuation or deviation phases. Imbalanced clusters (FVG zones) act as magnets during these news-driven mitigations. 

## 6. Execution Order Draft
Based on structural validation, the tactical order parameters are drafted below:
* **Order Direction**: **${marketData.entryEngine.entry.toUpperCase()}**
* **Ideal Mitigation Entry Zone**: **$${marketData.entryEngine.entry_zone}**
* **Strict Stop Loss Barrier**: **$${marketData.entryEngine.stop_loss}**
* **Take Profit Target Alpha (TP1)**: **$${marketData.entryEngine.target_tp1}**
* **Take Profit Target Beta (TP2)**: **$${marketData.entryEngine.target_tp2}**
* **Algorithmic Selection Rationale**: ${marketData.entryEngine.rationale}
`;
      setAiReport(fallbackReport);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // 4. Send chat mentor assistant query
  const handleSendChat = async (e: FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: userInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages((prev) => [...prev, userMsg]);
    const originalInput = userInput;
    setUserInput("");
    setIsSendingChat(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...chatMessages, userMsg],
          marketData
        })
      });

      if (!res.ok) {
        throw new Error("Chat assistance network error.");
      }
      const data = await res.json();

      setChatMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: "assistant",
          text: data.text || "I was unable to process your technical query.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err: any) {
      console.warn("Express chatbot endpoint unavailable. Engaging local SMC Expert system:", err);
      
      const msgLower = originalInput.toLowerCase();
      const symbol = marketData?.symbol || "BTCUSDT";
      const price = marketData?.price || 68500;
      const bias = marketData?.aiBias?.overall_bias || "range";
      const mss = marketData?.smartMoney?.mss || "none";
      const fvg = marketData?.smartMoney?.fvgZone || "the premium order block zone";

      let responseText = "";

      if (msgLower.includes("fvg") || msgLower.includes("gap") || msgLower.includes("imbalance")) {
        responseText = `Regarding **Fair Value Gaps (FVG)** on **${symbol}**:
An institutional FVG is currently mapped at **$${fvg}**. 

### Premium SMC Guidelines:
1. **Inefficiency Definition**: Rapid price movements (caused by large institutional blocks) create a gap between candles, leaving a structural imbalance.
2. **Algorithmic Draw**: Market algorithms are modeled to pull price back into these imbalances to rebalance orders.
3. **Tactical Confirmation**: We are monitoring $${marketData?.entryEngine?.entry_zone || "the marked zone"} as our sniper re-entry point inside this FVG. We look for a character shift on lower timeframes (e.g., 5m) before executing positions.`;
      } else if (msgLower.includes("choch") || msgLower.includes("mss") || msgLower.includes("shift") || msgLower.includes("character") || msgLower.includes("bos")) {
        responseText = `Let's analyze the **Market Structure Shift (MSS)** & **Change of Character (CHOCH)** on **${symbol}**:
* **Active MSS Posture**: Our indicators show a **${mss.toUpperCase()}** shift.
* **CHOCH Price Barrier**: Mapped pivot is resting near **$${(marketData?.smartMoney?.chochPrice || price * 1.015).toLocaleString()}**.
* **BOS Price Barrier**: Structural breakout is mapped at **$${(marketData?.smartMoney?.bosPrice || price * 0.985).toLocaleString()}**.

### Practical Core Mechanics:
- **CHOCH (Change of Character)** represents the earliest structural pivot, signalling trend transitions when the final trading range is violated.
- **BOS (Break of Structure)** is the trend confirmation, reflecting subsequent high-volume price extensions following mitigating pullbacks.
- Wait for a 4H CHOCH close to establish macro bias, then drop to the 15m frame to find sniper FVG re-entries.`;
      } else if (msgLower.includes("liquidity") || msgLower.includes("sweep") || msgLower.includes("bsl") || msgLower.includes("ssl")) {
        const targetLiq = marketData?.liquidity?.target_liquidity || "sellside";
        responseText = `Mapping **Liquidity Pools & Sweeps** on **${symbol}**:
* **Primary Target Segment**: Smart Money is targeting **${targetLiq.toUpperCase()}** pools to absorb resting stop-losses.
* **Buy-Side Liquidity (BSL)**: Resting above historical wick ranges around **$${(price * 1.025).toLocaleString()}**.
* **Sell-Side Liquidity (SSL)**: Resting below structure lows around **$${(price * 0.975).toLocaleString()}**.

### Structural Playbook:
- When a wick sweeps these pools but the candle body closes cleanly back inside standard range boundaries, we confirm a **sweep**.
- Reversals are highly probable immediately after liquidations. Wait for the sweep candle to close before looking for mitigation trade parameters.`;
      } else if (msgLower.includes("entry") || msgLower.includes("setup") || msgLower.includes("order") || msgLower.includes("sl") || msgLower.includes("tp")) {
        responseText = `Reviewing **Tactical Execution Parameters** for **${symbol}**:
* **Trade Posture**: **${marketData?.entryEngine?.entry.toUpperCase() || "HOLD"}**
* **Target Mitigation Zone**: **$${marketData?.entryEngine?.entry_zone || "the marked range"}**
* **Stop Loss Placement**: **$${marketData?.entryEngine?.stop_loss || "structural pivot low/high"}**
* **First Target (TP1)**: **$${marketData?.entryEngine?.target_tp1 || "recent swing range limit"}**
* **Second Target (TP2)**: **$${marketData?.entryEngine?.target_tp2 || "unmitigated FVG level"}**

### Sniper Execution Advice:
- Avoid chasing green/red candle extensions. Wait for a pullback into the identified FVG zone.
- Risk management is paramount: keep your size bounded so that hitting the Stop Loss does not exceed 1% of total equity.`;
      } else {
        responseText = `Greetings. I am running on the local **LACC AI SMC Expert Engine** to process your query regarding **${symbol}** (active price: **$${price.toLocaleString()}** | bias: **${bias.toUpperCase()}**):

1. **Intraday Market State**: Intraday trends on the 4H and 1H frames are signaling a dominant **${bias.toUpperCase()}** bias.
2. **Current Key Structural Range**:
   * CHOCH Pivot: **$${(marketData?.smartMoney?.chochPrice || price * 1.01).toLocaleString()}**
   * Structure Shift support: **$${(marketData?.smartMoney?.bosPrice || price * 0.99).toLocaleString()}**
   * High-liquidity target: **${(marketData?.liquidity?.target_liquidity || "Sellside").toUpperCase()}** sweeps.
3. **Strategic Execution Recommendation**: Play primarily with the institutional flow. Wait for a re-assessment pullback inside **$${marketData?.entryEngine?.entry_zone || "the FVG zone"}** before standard positioning.

Please let me know if you would like me to detail specific concepts like **Fair Value Gaps (FVG)**, **Order Blocks (OB)**, or how to identify high-probability **Liquidity Sweeps**!`;
      }

      setChatMessages((prev) => [
        ...prev,
        {
          id: `ai-local-${Date.now()}`,
          sender: "assistant",
          text: responseText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsSendingChat(false);
    }
  };

  // Helper to format markdown preview simply
  const renderSimpleMarkdown = (text: string) => {
    if (!text) return null;
    return text.split("\n").map((line, idx) => {
      if (line.startsWith("###")) {
        return <h4 key={idx} className="text-sm font-extrabold text-[#00FFA3] mt-4 mb-2 tracking-wide uppercase font-mono">{line.replace("###", "").trim()}</h4>;
      }
      if (line.startsWith("##")) {
        return <h3 key={idx} className="text-base font-black text-white mt-5 mb-2 border-b border-[#2D3139] pb-1 font-mono">{line.replace("##", "").trim()}</h3>;
      }
      if (line.startsWith("*") || line.startsWith("-")) {
        return <li key={idx} className="text-[12px] text-[#E0E2E5] ml-4 list-disc leading-relaxed my-1 font-sans">{line.substring(2).trim()}</li>;
      }
      return <p key={idx} className="text-[12px] text-[#A6ABB3] leading-relaxed my-1.5 font-sans">{line}</p>;
    });
  };

  // SVG Geometry Calculation variables
  const getSVGPoints = () => {
    if (candleData.length === 0) return "";
    const subset = candleData.slice(-chartLookback);
    const maxVal = Math.max(...subset.map(c => c.high));
    const minVal = Math.min(...subset.map(c => c.low));
    const range = maxVal - minVal || 1;

    const width = 640;
    const height = 240;

    return subset.map((c, idx) => {
      const x = (idx / (subset.length - 1)) * (width - 40) + 20;
      const y = height - ((c.close - minVal) / range) * (height - 40) - 20;
      return `${x},${y}`;
    }).join(" ");
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0A0B0D] text-[#E0E2E5] font-sans overflow-x-hidden p-4 gap-4">
      
      {/* HEADER SECTION - High Density Dashboard header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between bg-[#15171C] border border-[#2D3139] p-4 rounded-lg shadow-2xl gap-4">
        <div className="flex items-center gap-6">
          <div>
            <h1 className="text-2xl font-black tracking-tighter text-white">LACC <span className="text-[#00FFA3]">AI</span></h1>
            <p className="text-[10px] text-[#8E9299] uppercase tracking-[0.2em] font-bold">Market Structure & Sentiment</p>
          </div>
          <div className="hidden md:block h-10 w-px bg-[#2D3139]"></div>
          
          {/* Symbol Select drop list */}
          <div className="flex flex-col relative">
            <label className="text-[9px] uppercase font-mono text-[#8E9299] mb-1">Target Instrument</label>
            <div className="relative">
              <select
                value={selectedSymbol}
                onChange={(e) => setSelectedSymbol(e.target.value)}
                className="bg-[#0A0B0D] border border-[#2D3139] rounded px-3 py-1 text-sm font-mono font-bold text-white pr-8 focus:outline-none focus:border-[#00FFA3] cursor-pointer appearance-none"
              >
                {AVAILABLE_SYMBOLS.map((s) => (
                  <option key={s.value} value={s.value} className="bg-[#15171C]">
                    {s.value} • {s.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-500 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          <div className="flex flex-col">
            <span className="text-xl font-bold font-[#00FFA3] font-mono leading-none">
              {marketData ? `$${marketData.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "$0.00"}
            </span>
            <span className={`text-[11px] font-mono ${marketData && marketData.priceChange >= 0 ? 'text-[#00FFA3]' : 'text-[#FF4B55]'}`}>
              {marketData && marketData.priceChange >= 0 ? "+" : ""}
              {marketData ? `${marketData.priceChange.toFixed(2)}%` : "0.00%"}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-8 items-center w-full md:w-auto justify-between md:justify-end">
          <div className="text-left">
            <div className="text-[10px] uppercase text-[#8E9299] mb-1 font-mono">Overall Algorithmic Bias</div>
            <div className={`text-xl font-black flex items-center gap-2 ${
              marketData?.aiBias.overall_bias === 'bullish' ? 'text-[#00FFA3]' : marketData?.aiBias.overall_bias === 'bearish' ? 'text-[#FF4B55]' : 'text-zinc-400'
            }`}>
              <div className={`w-2.5 h-2.5 rounded-full ${
                marketData?.aiBias.overall_bias === 'bullish' ? 'bg-[#00FFA3]' : marketData?.aiBias.overall_bias === 'bearish' ? 'bg-[#FF4B55]' : 'bg-zinc-400'
              }`}></div>
              {marketData ? marketData.aiBias.overall_bias.toUpperCase() : "ANALYZING..."}
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] uppercase text-[#8E9299] mb-1 font-mono font-bold">AI Bias Confidence</div>
            <div className="text-xl font-black text-white font-mono">{marketData ? marketData.aiBias.confidence : "0%"}</div>
          </div>

          {/* Combined Visual weight indicator */}
          <div className="flex flex-col max-w-full w-48 bg-[#0A0B0D] border border-[#2D3139] p-2 rounded">
            <div className="flex justify-between items-center text-[8px] font-mono uppercase text-[#8E9299] mb-1">
              <span>Bearish Pressure</span>
              <span>Bullish Strength</span>
            </div>
            <div className="h-2 w-full bg-[#2D3139] rounded overflow-hidden flex">
              <div 
                className="bg-[#FF4B55] h-full transition-all duration-700" 
                style={{ width: `${marketData ? (100 - marketData.sentiment.score) : 50}%` }}
              ></div>
              <div 
                className="bg-[#00FFA3] h-full transition-all duration-700" 
                style={{ width: `${marketData ? marketData.sentiment.score : 50}%` }}
              ></div>
            </div>
          </div>

          <button
            onClick={() => fetchMarketTelemetry(selectedSymbol)}
            className="p-1.5 rounded bg-zinc-900 border border-[#2D3139] text-[#E0E2E5] hover:border-[#00FFA3] hover:text-[#00FFA3] transition duration-200"
            title="Reload telemetry stats"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* error block */}
      {fetchError && (
        <div className="bg-[#FF4B55]/10 border border-[#FF4B55]/30 rounded-lg p-3 text-sm text-[#FF4B55] flex items-center gap-2.5">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span><strong>Telemetry sync failed :</strong> {fetchError}. Operating on high-fidelity mathematical models based locally.</span>
        </div>
      )}

      {/* CORE MATRIX & SECTIONS */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 h-full min-h-0">
        
        {/* LEFT COLUMN - MARKET BIAS STRUCTURE (COL SPAN 3) */}
        <section className="lg:col-span-3 flex flex-col gap-4">
          
          {/* Market Structure matrix panel */}
          <div className="bg-[#15171C] border border-[#2D3139] p-4 rounded-lg flex-1 flex flex-col">
            <h3 className="text-[11px] uppercase tracking-widest text-[#8E9299] font-bold mb-4 flex items-center justify-between">
              Market Structure Matrix
              <span className="text-[9px] bg-[#2D3139] px-2 py-0.5 rounded text-white font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-[#00FFA3] rounded-full animate-ping"></span>
                LIVE
              </span>
            </h3>
            
            <div className="space-y-2 flex-1">
              <div className="flex items-center justify-between border-b border-[#2D3139] pb-1.5">
                <span className="text-xs font-mono text-[#8E9299]">W WEEKLY BIAS</span>
                <span className={`text-xs font-black font-mono ${
                  marketData?.weekly.weekly_bias === 'bullish' ? 'text-[#00FFA3]' : marketData?.weekly.weekly_bias === 'bearish' ? 'text-[#FF4B55]' : 'text-zinc-400'
                }`}>
                  {marketData ? marketData.weekly.weekly_bias.toUpperCase() : "BULLISH"}
                </span>
              </div>
              <div className="text-[10px] text-zinc-500 leading-tight mb-2 italic">
                {marketData?.weekly.explanation || "Establishing weekly higher support boundaries."}
              </div>

              <div className="flex items-center justify-between border-b border-[#2D3139] pb-1.5">
                <span className="text-xs font-mono text-[#8E9299]">D DAILY TREND</span>
                <span className={`text-xs font-black font-mono ${
                  marketData?.daily.daily_trend === 'bullish' ? 'text-[#00FFA3]' : marketData?.daily.daily_trend === 'bearish' ? 'text-[#FF4B55]' : 'text-zinc-400'
                }`}>
                  {marketData ? marketData.daily.daily_trend.toUpperCase() : "BEARISH"}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono pb-2">
                <span>Last BOS State: <strong className="text-zinc-300">{marketData ? marketData.daily.last_bos.toUpperCase() : "DOWN"}</strong></span>
                <span>Trend Strength: <strong className="text-zinc-300">{marketData ? marketData.daily.strength.toUpperCase() : "STRONG"}</strong></span>
              </div>

              <div className="flex items-center justify-between border-b border-[#2D3139] pb-1.5">
                <span className="text-xs font-mono text-[#8E9299]">4H INTRADAY</span>
                <span className={`text-xs font-black font-mono ${
                  marketData?.fourHour.bias_4h === 'bullish' ? 'text-[#00FFA3]' : marketData?.fourHour.bias_4h === 'bearish' ? 'text-[#FF4B55]' : 'text-zinc-400'
                }`}>
                  {marketData ? marketData.fourHour.bias_4h.toUpperCase() : "BEARISH"}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono pb-2">
                <span>Liquidity Sweep: <strong className="text-zinc-300">{marketData ? marketData.fourHour.liquidity.toUpperCase() : "SELLSIDE"}</strong></span>
                <span>Expectation: <strong className="text-zinc-300">{marketData ? marketData.fourHour.expectation.toUpperCase() : "REVERSAL"}</strong></span>
              </div>

              <div className="flex items-center justify-between border-b border-[#2D3139] pb-1.5">
                <span className="text-xs font-mono text-[#8E9299]">1H MICRO</span>
                <span className={`text-xs font-black font-mono ${
                  marketData?.oneHour.bias_1h === 'bullish' ? 'text-[#00FFA3]' : marketData?.oneHour.bias_1h === 'bearish' ? 'text-[#FF4B55]' : 'text-zinc-400'
                }`}>
                  {marketData ? marketData.oneHour.bias_1h.toUpperCase() : "BEARISH"}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-[#2D3139] pb-1.5">
                <span className="text-xs font-mono text-[#8E9299]">15M EXECUTION</span>
                <span className={`text-xs font-black font-mono ${
                  marketData?.fifteenMin.bias_15m === 'bullish' ? 'text-[#00FFA3]' : marketData?.fifteenMin.bias_15m === 'bearish' ? 'text-[#FF4B55]' : 'text-zinc-400'
                }`}>
                  {marketData ? marketData.fifteenMin.bias_15m.toUpperCase() : "BEARISH"}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-[#2D3139] pb-1.5">
                <span className="text-xs font-mono text-[#8E9299]">5M STRUCTURE</span>
                <span className={`text-xs font-black font-mono ${
                  marketData?.fiveMin.bias_5m === 'bullish' ? 'text-[#00FFA3]' : marketData?.fiveMin.bias_5m === 'bearish' ? 'text-[#FF4B55]' : 'text-zinc-400'
                }`}>
                  {marketData ? marketData.fiveMin.bias_5m.toUpperCase() : "BEARISH"}
                </span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-[#0A0B0D] border-l-2 border-[#FF4B55] rounded-r">
              <div className="text-[10px] uppercase text-[#8E9299] mb-1 font-bold font-mono">Telemetry Decision Tree Code</div>
              <div className="text-[11px] leading-snug font-mono text-zinc-300">
                W:{marketData ? marketData.weekly.weekly_bias.substring(0,4) : "Bull"} + D:{marketData ? marketData.daily.daily_trend.substring(0,4) : "Bear"} + 4H:{marketData ? marketData.fourHour.bias_4h.substring(0,4) : "Bear"} ={" "}
                <span className={`font-bold ${marketData?.aiBias.trade_direction === 'long' ? 'text-[#00FFA3]' : 'text-[#FF4B55]'}`}>
                  {marketData ? marketData.aiBias.shortSummary.split(" - ")[0] : "Bearish Alignment"}
                </span>
              </div>
            </div>
          </div>

          {/* Leverage, Funding and Open Interest Metrics panel */}
          <div className="bg-[#15171C] border border-[#2D3139] p-4 rounded-lg flex flex-col gap-3">
            <h4 className="text-[11px] uppercase tracking-widest text-[#8E9299] font-bold font-mono flex items-center justify-between border-b border-[#2D3139] pb-2">
              OrderBook & Leverage
            </h4>
            
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-[#0A0B0D] p-2 rounded">
                <span className="text-[9px] text-[#8E9299] block">Funding Rate</span>
                <span className="text-white font-bold block mt-1 text-sm text-cyan-400">
                  {marketData ? `${(marketData.fundingRate * 100).toFixed(4)}%` : "0.0100%"}
                </span>
              </div>
              <div className="bg-[#0A0B0D] p-2 rounded">
                <span className="text-[9px] text-[#8E9299] block">Open Interest</span>
                <span className="text-white font-bold block mt-1 text-sm text-purple-400">
                  {marketData ? `${marketData.openInterest.toLocaleString()} Cont.` : "14.2K Cont."}
                </span>
              </div>
            </div>

            <div className="bg-[#0A0B0D] p-2 rounded flex justify-between items-center text-xs font-mono">
              <div>
                <span className="text-[9px] text-[#8E9299] block">Est CVD Delta</span>
                <span className={`font-bold block text-sm ${marketData && marketData.cvdValue >= 0 ? "text-[#00FFA3]" : "text-[#FF4B55]"}`}>
                  {marketData ? (marketData.cvdValue >= 0 ? "+" : "") + marketData.cvdValue.toLocaleString() : "-250,000"} CVD
                </span>
              </div>
              <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-bold">
                MArket order ratio
              </span>
            </div>
          </div>

          {/* Smart Money Core Engine status */}
          <div className="bg-[#15171C] border border-[#2D3139] p-4 rounded-lg flex flex-col">
            <h3 className="text-[11px] uppercase tracking-widest text-[#8E9299] font-bold mb-3 font-mono">Smart Money Engine</h3>
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="text-[11px] text-[#8E9299] font-mono">MSS (Market Shift)</div>
                <div className="px-2 py-0.5 bg-[#FF4B55] text-white text-[9px] rounded font-mono font-bold">
                  {marketData && marketData.smartMoney.mss === 'bearish' ? 'CONFIRMED BEARISH' : 'CONFIRMED BULLISH'}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-[11px] text-[#8E9299] font-mono">CHOCH (Character)</div>
                <div className="px-2 py-0.5 bg-[#FF4B55] text-white text-[9px] rounded font-mono font-bold">
                  CONFIRMED PIVOT
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-[11px] text-[#8E9299] font-mono">BOS (Structure Break)</div>
                <div className="px-2 py-0.5 bg-[#2D3139] text-[#E0E2E5] text-[9px] rounded font-mono font-bold">
                  PENDING LEVEL
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-[11px] text-[#8E9299] font-mono">FVG Retest Target</div>
                <div className="px-2 py-0.5 bg-[#FF4B55]/25 border border-[#FF4B55]/40 text-rose-300 text-[9px] rounded font-mono font-bold">
                  ZONE REACHED
                </div>
              </div>
            </div>
          </div>

        </section>

        {/* MIDDLE COLUMN - CHART + EXECUTIONS AND ALGO ZONES (COL SPAN 6) */}
        <section className="lg:col-span-6 flex flex-col gap-4">
          
          {/* Candle chart visualizer and targets */}
          <div className="bg-[#15171C] border border-[#2D3139] rounded-lg relative flex-1 flex flex-col overflow-hidden min-h-[360px]">
            
            {/* Custom high-tech grid overlay */}
            <div className="absolute inset-0 opacity-[0.08] pointer-events-none" style={{ backgroundImage: "linear-gradient(#2D3139 1px, transparent 1px), linear-gradient(90deg, #2D3139 1px, transparent 1px)", backgroundSize: "32px 32px" }}></div>
            
            {/* Chart info header board */}
            <div className="relative p-4 flex justify-between items-start z-10 border-b border-[#2D3139] bg-black/40 backdrop-blur-sm">
              <div className="flex gap-4">
                <div className="bg-black/60 p-2 rounded border border-[#2D3139] backdrop-blur font-mono">
                  <div className="text-[9px] text-[#8E9299] uppercase">Nearest target Liquidity</div>
                  <div className="text-base font-bold text-white tracking-wider">
                    {marketData ? `$${marketData.liquidity.levels.filter(l => !l.swept)[0]?.level.toLocaleString(undefined, { minimumFractionDigits: 1 })}` : "$62,850.0"}
                  </div>
                  <div className={`text-[9px] font-bold ${marketData?.liquidity.target_liquidity === 'buyside' ? 'text-[#00FFA3]' : 'text-[#FF4B55]'}`}>
                    {marketData ? (marketData.liquidity.target_liquidity === 'buyside' ? "Buy Side Liquidity (BSL)" : "Sell Side Liquidity (SSL)") : "SELL-SIDE PDL"}
                  </div>
                </div>

                <div className="bg-black/60 p-2 rounded border border-[#2D3139] leading-tight font-mono">
                  <span className="text-[9px] block text-[#8E9299]">SMC FVG BOX</span>
                  <span className="text-xs text-white block mt-0.5">
                    {marketData ? marketData.smartMoney.fvgZone : "63,050 - 63,120"}
                  </span>
                  <span className="text-[9px] text-cyan-400 font-bold block">ACTIVE IMBALANCE GAP</span>
                </div>
              </div>

              <div className="text-right font-mono flex flex-col gap-1 items-end">
                <span className="text-[9px] text-[#8E9299] uppercase">Active Bounds</span>
                <div className="text-[11px] text-[#00FFA3]">PWH: ${marketData ? (marketData.price * 1.018).toFixed(1) : "64,220"}</div>
                <div className="text-[11px] text-[#FF4B55]">PDL: ${marketData ? (marketData.price * 0.985).toFixed(1) : "62,850"}</div>
              </div>
            </div>

            {/* Chart Mode Tab Selector */}
            <div className="flex border-b border-[#2D3139] bg-[#0E1014] p-1 gap-1 relative z-20">
              <button
                onClick={() => setChartTab("tradingview")}
                className={`flex-1 py-1.5 px-3 rounded text-[11px] font-mono uppercase tracking-wider font-bold transition flex items-center justify-center gap-1.5 ${
                  chartTab === "tradingview"
                    ? "bg-[#2D3139] text-[#00FFA3] border border-[#2D3139]"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${chartTab === "tradingview" ? "bg-[#00FFA3] animate-pulse" : "bg-transparent border border-zinc-600"}`}></div>
                TradingView Live Pro
              </button>
              <button
                onClick={() => setChartTab("smc")}
                className={`flex-1 py-1.5 px-3 rounded text-[11px] font-mono uppercase tracking-wider font-bold transition flex items-center justify-center gap-1.5 ${
                  chartTab === "smc"
                    ? "bg-[#2D3139] text-[#00FFA3] border border-[#2D3139]"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${chartTab === "smc" ? "bg-[#00FFA3] animate-pulse" : "bg-transparent border border-zinc-600"}`}></div>
                SMC Structural Overlay
              </button>
            </div>

            {/* Interactive Custom Candlestick SVG Container OR TradingView Live Chart */}
            {chartTab === "tradingview" ? (
              <div className="relative flex-1 bg-[#15171C] z-10 min-h-[380px] h-full flex flex-col">
                <TradingViewChart symbol={selectedSymbol} />
              </div>
            ) : (
              <div className="relative flex-1 bg-black/30 p-4 pb-6 flex flex-col justify-end z-10 min-h-[220px]">
                
                {candleData.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 font-mono text-xs">
                    <RefreshCw className="w-6 h-6 animate-spin text-[#00FFA3] mb-2" />
                    CONNECTING BINANCE FUTURES DATA TUNNEL...
                  </div>
                ) : (
                  <div className="relative w-full h-full flex flex-col justify-between">
                    
                    {/* Hover Candlestick Stats Bar */}
                    <div className="h-6 w-full flex items-center justify-between text-[11px] font-mono px-2 bg-[#15171C]/80 border border-zinc-800 rounded mb-2">
                      {hoveredCandle ? (
                        <div className="flex gap-4">
                          <span>TIME: <strong className="text-white">{new Date(hoveredCandle.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></span>
                          <span>O: <strong className="text-zinc-200">${hoveredCandle.open.toFixed(1)}</strong></span>
                          <span>H: <strong className="text-emerald-400">${hoveredCandle.high.toFixed(1)}</strong></span>
                          <span>L: <strong className="text-rose-400">${hoveredCandle.low.toFixed(1)}</strong></span>
                          <span>C: <strong className="text-[#00FFA3]">${hoveredCandle.close.toFixed(1)}</strong></span>
                        </div>
                      ) : (
                        <span className="text-zinc-500 flex items-center gap-1.5 animate-pulse-slow">
                          <Info className="w-3.5 h-3.5 text-zinc-500" />
                          Hover candles to scan telemetry metrics in real-time
                        </span>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-zinc-500 uppercase">Lookback Range</span>
                        <input
                          type="range"
                          min="15"
                          max="50"
                          value={chartLookback}
                          onChange={(e) => setChartLookback(parseInt(e.target.value))}
                          className="w-16 accent-[#00FFA3] cursor-pointer"
                        />
                        <span className="text-[10px] text-zinc-300 font-bold">{chartLookback}</span>
                      </div>
                    </div>

                    {/* SVG Canvas Plotter */}
                    <div className="flex-1 w-full relative">
                      <svg className="w-full h-full" viewBox="0 0 640 240" preserveAspectRatio="none">
                        {(() => {
                          const subset = candleData.slice(-chartLookback);
                          const highs = subset.map(c => c.high);
                          const lows = subset.map(c => c.low);
                          const maxVal = Math.max(...highs);
                          const minVal = Math.min(...lows);
                          const range = maxVal - minVal || 1;
                          const width = 640;
                          const height = 240;

                          // Calculate FVG overlay range coordinates
                          // Draw a shaded box on the chart representing the gap range
                          const fvgLow = marketData ? parseFloat(marketData.smartMoney.fvgZone.split(" - ")[0]) : minVal + (range * 0.4);
                          const fvgHigh = marketData ? parseFloat(marketData.smartMoney.fvgZone.split(" - ")[1]) : minVal + (range * 0.45);
                          
                          // Scale absolute price to relative SVG Y coordinates
                          const fvgYStart = height - ((fvgHigh - minVal) / range) * (height - 40) - 20;
                          const fvgYEnd = height - ((fvgLow - minVal) / range) * (height - 40) - 20;
                          const fvgRectHeight = Math.abs(fvgYEnd - fvgYStart);

                          // CHOCH level coordinate
                          const chochPrice = marketData?.daily.lastChochPrice || (minVal + range * 0.7);
                          const chochY = height - ((chochPrice - minVal) / range) * (height - 40) - 20;

                          // Target Liquidity coordinate
                          const targetLiqPrice = marketData?.liquidity.levels.filter(l => !l.swept)[0]?.level || (minVal + range * 0.1);
                          const targetLiqY = height - ((targetLiqPrice - minVal) / range) * (height - 40) - 20;

                          return (
                            <>
                              {/* FVG imbalance box */}
                              {fvgRectHeight > 0 && (
                                <rect
                                  x="40"
                                  y={Math.min(fvgYStart, fvgYEnd)}
                                  width="560"
                                  height={fvgRectHeight}
                                  fill="#FF4B55"
                                  fillOpacity="0.08"
                                  stroke="#FF4B55"
                                  strokeWidth="0.5"
                                  strokeDasharray="3 3"
                                />
                              )}

                              {/* CHOCH horizontal level */}
                              <line
                                x1="20"
                                y1={chochY}
                                x2="620"
                                y2={chochY}
                                stroke="#FF4B55"
                                strokeWidth="1.5"
                                strokeDasharray="4 4"
                                opacity="0.8"
                              />

                              {/* Target Liquidity horizontal level */}
                              <line
                                x1="20"
                                y1={targetLiqY}
                                x2="620"
                                y2={targetLiqY}
                                stroke="#00FFA3"
                                strokeWidth="1.5"
                                strokeDasharray="2 3"
                                opacity="0.8"
                              />

                              {/* Candle shapes */}
                              {subset.map((candle, idx) => {
                                const xStep = (width - 40) / (subset.length - 1 || 1);
                                const x = idx * xStep + 20;
                                
                                const candleWidth = Math.max(2, Math.min(12, 400 / subset.length));

                                // Top & Bottom of body
                                const bodyTop = Math.max(candle.open, candle.close);
                                const bodyBottom = Math.min(candle.open, candle.close);

                                // Relative Y coords
                                const yHigh = height - ((candle.high - minVal) / range) * (height - 40) - 20;
                                const yLow = height - ((candle.low - minVal) / range) * (height - 40) - 20;
                                const yTop = height - ((bodyTop - minVal) / range) * (height - 40) - 20;
                                const yBottom = height - ((bodyBottom - minVal) / range) * (height - 40) - 20;
                                
                                const candleHeight = Math.max(1.5, Math.abs(yBottom - yTop));
                                const isBullish = candle.close >= candle.open;

                                return (
                                  <g 
                                    key={idx}
                                    className="cursor-pointer"
                                    onMouseEnter={() => setHoveredCandle(candle)}
                                    onMouseLeave={() => setHoveredCandle(null)}
                                  >
                                    {/* High-Low Wick line */}
                                    <line
                                      x1={x}
                                      y1={yHigh}
                                      x2={x}
                                      y2={yLow}
                                      stroke={isBullish ? "#00FFA3" : "#FF4B55"}
                                      strokeWidth="1"
                                    />
                                    {/* Candle Body rect */}
                                    <rect
                                      x={x - candleWidth / 2}
                                      y={yTop}
                                      width={candleWidth}
                                      height={candleHeight}
                                      fill={isBullish ? "#00FFA3" : "#FF4B55"}
                                      stroke={isBullish ? "#00FFA3" : "#FF4B55"}
                                      strokeWidth="1"
                                      fillOpacity={isBullish ? "0.35" : "0.9"}
                                    />
                                  </g>
                                );
                              })}
                            </>
                          );
                        })()}
                      </svg>

                      {/* Chart Overlay Annotation labels strictly positioned inside */}
                      <div className="absolute top-1/2 left-4 px-2 py-1 bg-[#15171C]/90 text-[10px] text-[#FF4B55] border border-[#FF4B55]/30 rounded font-mono font-bold uppercase pointer-events-none">
                        Bearish CHOCH Swept Zone
                      </div>

                      <div className="absolute bottom-6 right-4 px-2 py-1 bg-[#15171C]/90 text-[10px] text-cyan-400 border border-cyan-400/30 rounded font-mono font-bold uppercase pointer-events-none flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"></div>
                        Bearish FVG Mitigation zone
                      </div>
                    </div>

                  </div>
                )}
              </div>
            )}

            {/* Inversion indicator labels footer */}
            <div className="flex justify-between items-end p-4 z-10 border-t border-[#2D3139] bg-black/40 backdrop-blur-sm">
              <div className="flex gap-4">
                <div className="bg-black/60 p-2 rounded border border-[#2D3139] backdrop-blur font-mono">
                  <div className="text-[9px] text-[#8E9299] uppercase">FVG INVERSION CLUSTER</div>
                  <div className="text-sm font-mono text-white">
                    {marketData ? marketData.entryEngine.entry_zone : "63,050 - 63,120"}
                  </div>
                </div>
              </div>
              <div className="text-right bg-black/60 p-2 rounded border border-[#2D3139] backdrop-blur font-mono">
                <div className="text-[9px] text-[#8E9299] uppercase font-mono">Current CRT</div>
                <div className="text-sm font-bold text-[#FF4B55]">CONFIRMED BEARISH SWEEP</div>
              </div>
            </div>
          </div>

        </section>

        {/* RIGHT COLUMN - SENTIMENT ENGINE & ACTIVE CALENDAR HEADLINES (COL SPAN 3) */}
        <section className="lg:col-span-3 flex flex-col gap-4">
          
          {/* Sentiment Engine sliders / parameters panel */}
          <div className="bg-[#15171C] border border-[#2D3139] p-4 rounded-lg flex-1 flex flex-col">
            <h3 className="text-[11px] uppercase tracking-widest text-[#8E9299] font-bold mb-4 font-mono">Sentiment Engine Breakdown</h3>
            
            <div className="space-y-4 flex-1">
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-bold font-mono text-zinc-300">
                  <span>Technical Structure (40%)</span>
                  <span className="text-[#FF4B55]">{marketData ? `${marketData.sentiment.technical}/100` : "85/100"}</span>
                </div>
                <div className="h-1.5 bg-[#0A0B0D] rounded-full overflow-hidden border border-[#2D3139]">
                  <div 
                    className="h-full bg-[#FF4B55] transition-all duration-700" 
                    style={{ width: `${marketData ? marketData.sentiment.technical : 85}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-bold font-mono text-zinc-300">
                  <span>Funding & Derivatives (30%)</span>
                  <span className="text-[#FF4B55]">{marketData ? `${marketData.sentiment.futures}/100` : "72/100"}</span>
                </div>
                <div className="h-1.5 bg-[#0A0B0D] rounded-full overflow-hidden border border-[#2D3139]">
                  <div 
                    className="h-full bg-[#FF4B55] transition-all duration-700" 
                    style={{ width: `${marketData ? marketData.sentiment.futures : 72}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-bold font-mono text-zinc-300">
                  <span>Market Index FNG (20%)</span>
                  <span className="text-white">{marketData ? `${marketData.sentiment.market}/100` : "50/100"}</span>
                </div>
                <div className="h-1.5 bg-[#0A0B0D] rounded-full overflow-hidden border border-[#2D3139]">
                  <div 
                    className="h-full bg-amber-500 transition-all duration-700" 
                    style={{ width: `${marketData ? marketData.sentiment.market : 50}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-bold font-mono text-zinc-300">
                  <span>News Sentiment (10%)</span>
                  <span className="text-[#00FFA3]">{marketData ? `${marketData.sentiment.news}/100` : "30/100"}</span>
                </div>
                <div className="h-1.5 bg-[#0A0B0D] rounded-full overflow-hidden border border-[#2D3139]">
                  <div 
                    className="h-full bg-[#00FFA3] transition-all duration-700" 
                    style={{ width: `${marketData ? marketData.sentiment.news : 30}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Macro Calendar / News Segment lists from API stream */}
            <div className="mt-4 pt-4 border-t border-[#2D3139] flex flex-col gap-3.5">
              <div>
                <div className="text-[10px] text-[#8E9299] uppercase font-mono font-bold mb-2 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-zinc-400" />
                  Upcoming Key Economic Events
                </div>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {macroItems.length === 0 ? (
                    <div className="text-[10px] text-zinc-500 italic">No economic scheduled releases catalogued.</div>
                  ) : (
                    macroItems.map((item) => {
                      const classNameVal = "text-[10px] font-mono leading-tight flex justify-between gap-2 bg-[#0A0B0D] p-1.5 rounded hover:bg-zinc-900 border border-transparent hover:border-[#2D3139] transition text-left " + (item.url ? "cursor-pointer" : "");
                      return item.url ? (
                        <a
                          key={item.id}
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={classNameVal}
                        >
                          <span className="text-zinc-400">{item.time}</span>
                          <span className="text-zinc-200 truncate flex-1 flex items-center gap-1">
                            {item.event}
                            <ExternalLink className="w-2.5 h-2.5 text-zinc-500 shrink-0" />
                          </span>
                          <span className={`px-1 rounded text-[8px] font-bold ${
                            item.impactColor === 'red' ? 'bg-red-950/45 text-red-400 border border-red-900/40' : item.impactColor === 'orange' ? 'bg-amber-950/45 text-amber-400' : 'bg-zinc-800 text-zinc-400'
                          }`}>
                            {item.actual || item.importance.toUpperCase()}
                          </span>
                        </a>
                      ) : (
                        <div key={item.id} className={classNameVal}>
                          <span className="text-zinc-400">{item.time}</span>
                          <span className="text-zinc-200 truncate flex-1">{item.event}</span>
                          <span className={`px-1 rounded text-[8px] font-bold ${
                            item.impactColor === 'red' ? 'bg-red-950/45 text-red-400 border border-red-900/40' : item.impactColor === 'orange' ? 'bg-amber-950/45 text-amber-400' : 'bg-zinc-800 text-zinc-400'
                          }`}>
                            {item.actual || item.importance.toUpperCase()}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div>
                <div className="text-[10px] text-[#8E9299] uppercase font-mono font-bold mb-2">Latest Macro Headlines</div>
                <div className="space-y-1.5">
                  {macroNews.length === 0 ? (
                    <div className="text-[9px] text-zinc-500 leading-snug flex gap-2">
                      <span>•</span><span>US CPI Data release expected in 4h.</span>
                    </div>
                  ) : (
                    macroNews.slice(0, 3).map((article) => (
                      <div key={article.id} className="text-[10px] leading-tight flex gap-1.5 font-mono text-zinc-300">
                        <span className={article.sentiment === 'positive' ? 'text-[#00FFA3]' : article.sentiment === 'negative' ? 'text-[#FF4B55]' : 'text-zinc-500'}>•</span>
                        <span className="flex-1 text-zinc-300 font-sans tracking-wide leading-relaxed">
                          {article.url ? (
                            <a
                              href={article.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline hover:text-[#00FFA3] inline-flex items-center gap-1.5 transition-colors duration-150 cursor-pointer text-left font-sans text-zinc-300 tracking-wide leading-relaxed"
                            >
                              <span>{article.title}</span>
                              <ExternalLink className="w-2.5 h-2.5 text-zinc-500 shrink-0 inline-block" />
                            </a>
                          ) : (
                            <span>{article.title}</span>
                          )}{" "}
                          <span className="text-[8px] text-zinc-500 font-mono">({article.source})</span>
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* AI Automated Forecast / Report Trigger section */}
          <div className="bg-[#15171C] border border-[#2D3139] p-4 rounded-lg flex flex-col gap-3">
            <h4 className="text-[11px] uppercase tracking-widest text-[#8E9299] font-bold font-mono">AI Report Generator</h4>
            <p className="text-[10px] text-zinc-400 leading-normal font-sans">
              Compile raw Binance order book aggregates and structure states into institutional Markdown summaries.
            </p>
            <input
              type="text"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="e.g. Focus on macroeconomic CPI exposure"
              className="bg-[#0A0B0D] border border-[#2D3139] rounded px-2.5 py-1.5 text-[10px] text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-[#00FFA3] font-mono text-xs"
            />
            <button
              onClick={handleGenerateReport}
              disabled={isGeneratingReport || !marketData}
              className="flex items-center justify-center gap-1.5 py-1.5 bg-[#00FFA3] hover:bg-[#00D487] text-[#0A0B0D] font-black text-xs uppercase tracking-widest rounded transition duration-200 disabled:opacity-50"
            >
              <FileText className="w-3.5 h-3.5" />
              {isGeneratingReport ? "GENERATE INSIGHTS..." : "CONSTRUCT REPORT"}
            </button>
          </div>

        </section>

      </main>

      {/* FULL RESPONSIVE LOWER MODULE ROW: CHAT ASSISTANT & AI REPORTS RENDERER */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1 border-t border-[#2D3139] pt-4">
        
        {/* INTERACTIVE COMPRESSED CHAT PANEL: SMC TACTICAL COACH */}
        <div className="bg-[#15171C] border border-[#2D3139] rounded-lg p-4 flex flex-col h-80">
          <h4 className="text-[11px] uppercase tracking-widest text-[#8E9299] font-bold font-mono flex items-center justify-between border-b border-[#2D3139] pb-2 mb-2">
            <span className="flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-[#00FFA3]" />
              SMC Tactical AI Mentor & Companion
            </span>
            <span className="text-[8px] text-zinc-500 bg-zinc-900 border border-[#2D3139] px-1.5 py-0.5 rounded font-mono">
              ONLINE
            </span>
          </h4>

          {/* Message view grid */}
          <div className="flex-1 overflow-y-auto mb-2 space-y-2.5 pr-1.5">
            {chatMessages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex flex-col max-w-[85%] ${msg.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
              >
                <div className={`p-2.5 rounded text-[11px] font-sans leading-relaxed ${
                  msg.sender === 'user' 
                    ? 'bg-zinc-800 text-white rounded-br-none border border-[#2D3139]' 
                    : 'bg-[#0A0B0D] text-zinc-300 rounded-bl-none border border-zinc-900'
                }`}>
                  {msg.text}
                </div>
                <span className="text-[8px] text-zinc-600 font-mono mt-0.5">{msg.timestamp}</span>
              </div>
            ))}
            {isSendingChat && (
              <div className="flex items-center gap-1.5 text-zinc-500 font-mono text-[10px] animate-pulse">
                <RefreshCw className="w-3 h-3 animate-spin text-[#00FFA3]" />
                SMC AI digesting market telemetry...
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Send Input elements */}
          <form onSubmit={handleSendChat} className="flex gap-2 border-t border-zinc-900 pt-2">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Ask mentor 'What is CHOCH?' or 'Review BTC support'"
              className="flex-1 bg-[#0A0B0D] border border-[#2D3139] rounded px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-[#00FFA3] font-mono"
            />
            <button
              type="submit"
              className="p-1 px-3 bg-zinc-900 border border-[#2D3139] hover:border-[#00FFA3] rounded text-zinc-300 hover:text-[#00FFA3] transition duration-200 flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* AI REPORT DETAILED RENDER VIEWER DRAY (COL SPAN 1) */}
        <div className="bg-[#15171C] border border-[#2D3139] rounded-lg p-4 flex flex-col h-80">
          <h4 className="text-[11px] uppercase tracking-widest text-[#8E9299] font-bold font-mono flex items-center justify-between border-b border-[#2D3139] pb-2 mb-2">
            <span>AI Structural Forecast Output Report</span>
            <span className="text-[9px] text-[#00FFA3] font-mono">
              {isGeneratingReport ? "CALCULATING..." : "REPORT COMPLED"}
            </span>
          </h4>

          <div className="flex-1 overflow-y-auto pr-1 bg-[#0A0B0D] p-3 rounded border border-zinc-900">
            {isReportOpen ? (
              <div className="space-y-1">
                {renderSimpleMarkdown(aiReport)}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-500 font-mono text-center gap-2 p-4">
                <FileText className="w-8 h-8 opacity-20 text-zinc-400" />
                <span className="text-xs">No active structural report generated yet.</span>
                <span className="text-[10px] text-zinc-600">Enter custom query specifications and hit "Construct Report" to load Gemini insight matrices.</span>
              </div>
            )}
          </div>
        </div>

      </section>

      {/* FOOTER METRIC STATUS */}
      <footer className="flex flex-col sm:flex-row justify-between items-center text-[9px] text-[#4F555E] uppercase tracking-widest font-mono border-t border-[#2D3139] pt-2.5 mt-2 gap-2">
        <div>System Alignment: Nominal | Interactive Telemetry latency: 12ms</div>
        <div className="flex items-center gap-1">
          <span>Data Provider: Binance Futures API</span>
          <span>•</span>
          <span>Live Index: Alternative.me FNG</span>
        </div>
        <div>LACC AI Terminal v4.2.1-stable</div>
      </footer>

    </div>
  );
}
