import { useEffect, useRef } from "react";

interface TradingViewChartProps {
  symbol: string;
}

export default function TradingViewChart({ symbol }: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Check if the script is already loaded
    let script = document.getElementById("tradingview-widget-script") as HTMLScriptElement;

    const initWidget = () => {
      if (typeof window !== "undefined" && (window as any).TradingView) {
        if (containerRef.current) {
          // Clear any previous widget contents
          containerRef.current.innerHTML = "";
          
          // Generate a unique dynamic random ID to prevent collisions
          const widgetId = `tradingview_${Math.random().toString(36).substring(2, 9)}`;
          const innerContainer = document.createElement("div");
          innerContainer.id = widgetId;
          innerContainer.style.height = "100%";
          innerContainer.style.width = "100%";
          containerRef.current.appendChild(innerContainer);

          new (window as any).TradingView.widget({
            autosize: true,
            symbol: `BINANCE:${symbol}`,
            interval: "240",
            timezone: "Etc/UTC",
            theme: "dark",
            style: "1",
            locale: "en",
            enable_publishing: false,
            hide_side_toolbar: false,
            allow_symbol_change: true,
            container_id: widgetId,
            studies: ["RSI@tv-basicstudies", "MASimple@tv-basicstudies"],
            gridColor: "#1A1D24",
            backgroundColor: "#15171C",
          });
        }
      }
    };

    if (!script) {
      script = document.createElement("script");
      script.id = "tradingview-widget-script";
      script.src = "https://s3.tradingview.com/tv.js";
      script.type = "text/javascript";
      script.async = true;
      script.onload = initWidget;
      document.head.appendChild(script);
    } else {
      if ((window as any).TradingView) {
        initWidget();
      } else {
        script.addEventListener("load", initWidget);
      }
    }

    return () => {
      if (script) {
        script.removeEventListener("load", initWidget);
      }
    };
  }, [symbol]);

  return (
    <div className="w-full h-full min-h-[380px] bg-[#15171C] rounded-lg overflow-hidden flex flex-col relative">
      <div ref={containerRef} className="w-full h-full flex-1" />
    </div>
  );
}
