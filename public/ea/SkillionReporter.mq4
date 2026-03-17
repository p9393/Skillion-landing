//+------------------------------------------------------------------+
//|  SkillionReporter.mq4                                            |
//|  Skillion Finance — Trade History Sync                           |
//|  https://skillion.finance                                         |
//|                                                                  |
//|  INSTALLATION:                                                   |
//|  1. Copy this file to: MT4/MQL4/Experts/                        |
//|  2. Restart MT4 or press F5 in MetaEditor                       |
//|  3. Attach to any chart (e.g. EURUSD H1)                        |
//|  4. In "Inputs" tab, paste your Skillion Sync Token             |
//|  5. Enable "Allow WebRequests" for: https://skillion.finance    |
//+------------------------------------------------------------------+

#property copyright   "Skillion Finance"
#property link        "https://skillion.finance"
#property version     "1.0"
#property description "Syncs your MT4 trade history to Skillion to compute your SDI Score."
#property strict

//--- Input parameters
input string SyncToken      = "";           // Skillion Sync Token (from your dashboard)
input int    SyncIntervalMin = 60;          // Sync interval in minutes (default: 60)
input bool   SyncOnStart    = true;         // Sync immediately on EA attach
input string ApiEndpoint    = "https://skillion.finance/api/mt4/sync";

//--- Globals
datetime lastSync  = 0;
string   eaVersion = "1.0.0";

//+------------------------------------------------------------------+
int OnInit()
{
   if(StringLen(SyncToken) < 10)
   {
      Alert("Skillion: Invalid Sync Token. Please copy it from your Skillion dashboard.");
      return(INIT_FAILED);
   }

   Comment("Skillion Reporter v" + eaVersion + " | Token: " + StringSubstr(SyncToken, 0, 8) + "...");
   Print("SkillionReporter: Initialized. Token: ", StringSubstr(SyncToken, 0, 8), "...");

   if(SyncOnStart)
   {
      Print("SkillionReporter: Syncing on start...");
      SyncTrades();
   }

   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
void OnTimer()
{
   if(TimeCurrent() - lastSync >= SyncIntervalMin * 60)
      SyncTrades();
}

//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   EventKillTimer();
   Comment("");
}

//+------------------------------------------------------------------+
void SyncTrades()
{
   lastSync = TimeCurrent();
   Print("SkillionReporter: Building trade payload...");

   string json = BuildTradeJSON();
   if(json == "")
   {
      Print("SkillionReporter: No closed trades found.");
      Comment("Skillion Reporter | No trades to sync yet.");
      return;
   }

   string headers = "Content-Type: application/json\r\nX-Skillion-Token: " + SyncToken + "\r\nX-Skillion-Platform: MT4";
   char   postData[];
   char   responseData[];
   string responseHeaders;

   StringToCharArray(json, postData, 0, StringLen(json));
   ArrayResize(postData, ArraySize(postData) - 1); // remove null terminator

   Print("SkillionReporter: Sending ", ArraySize(postData), " bytes to Skillion API...");

   int res = WebRequest("POST", ApiEndpoint, headers, 5000, postData, responseData, responseHeaders);

   if(res == 200)
   {
      string resp = CharArrayToString(responseData);
      Print("SkillionReporter: Sync OK — ", resp);

      // Parse SDI from response if available
      int sdiPos = StringFind(resp, "\"sdi\":");
      string sdiStr = "";
      if(sdiPos >= 0) sdiStr = " | SDI: " + StringSubstr(resp, sdiPos + 6, 6);

      Comment("Skillion Reporter v" + eaVersion + sdiStr + " | Last sync: " + TimeToStr(TimeCurrent(), TIME_DATE|TIME_MINUTES));
   }
   else if(res == -1)
   {
      int errCode = GetLastError();
      Print("SkillionReporter: WebRequest BLOCKED (code ", errCode, "). Enable WebRequests in MT4: Tools > Options > Expert Advisors > Allow WebRequests > add https://skillion.finance");
      Comment("Skillion Reporter | ERROR: WebRequest blocked." +
              " Go to: Tools > Options > Expert Advisors" +
              " > Allow WebRequests > add: https://skillion.finance");
      Alert("Skillion: WebRequest blocked by MT4.\n\nFix: Tools > Options > Expert Advisors\n> Check 'Allow WebRequests for listed URL'\n> Add: https://skillion.finance");
   }
   else
   {
      string errMsg = CharArrayToString(responseData);
      Print("SkillionReporter: Sync ERROR — HTTP ", res, " | ", errMsg);
      Comment("Skillion Reporter | Sync error: HTTP " + IntegerToString(res) + " — " + errMsg);
   }

   EventSetTimer(SyncIntervalMin * 60);
}

//+------------------------------------------------------------------+
string BuildTradeJSON()
{
   int total = OrdersHistoryTotal();
   if(total == 0) return("");

   string broker = AccountCompany();
   string login  = IntegerToString(AccountNumber());
   string server = AccountServer();

   string tradesJson = "[";
   int    count      = 0;

   for(int i = 0; i < total; i++)
   {
      if(!OrderSelect(i, SELECT_BY_POS, MODE_HISTORY)) continue;

      int type = OrderType();
      // Only closed BUY/SELL trades
      if(type != OP_BUY && type != OP_SELL) continue;

      if(count > 0) tradesJson += ",";

      tradesJson += "{";
      tradesJson += "\"ticket\":"      + IntegerToString(OrderTicket())                              + ",";
      tradesJson += "\"symbol\":\""    + EscapeJSON(OrderSymbol())                                    + "\",";
      tradesJson += "\"type\":\""      + (type == OP_BUY ? "buy" : "sell")                          + "\",";
      tradesJson += "\"lots\":"        + DoubleToStr(OrderLots(), 2)                                 + ",";
      tradesJson += "\"openTime\":"    + IntegerToString((int)OrderOpenTime())                       + ",";
      tradesJson += "\"closeTime\":"   + IntegerToString((int)OrderCloseTime())                      + ",";
      tradesJson += "\"openPrice\":"   + DoubleToStr(OrderOpenPrice(), 5)                            + ",";
      tradesJson += "\"closePrice\":"  + DoubleToStr(OrderClosePrice(), 5)                           + ",";
      tradesJson += "\"profit\":"      + DoubleToStr(OrderProfit(), 2)                               + ",";
      tradesJson += "\"commission\":"  + DoubleToStr(OrderCommission(), 2)                           + ",";
      tradesJson += "\"swap\":"        + DoubleToStr(OrderSwap(), 2)                                 + ",";
      tradesJson += "\"comment\":\""   + EscapeJSON(OrderComment())                                  + "\"";
      tradesJson += "}";
      count++;
   }

   tradesJson += "]";
   if(count == 0) return("");

   string fullJson = "{";
   fullJson += "\"platform\":\"MT4\",";
   fullJson += "\"version\":\"" + eaVersion + "\",";
   fullJson += "\"broker\":\""  + EscapeJSON(broker) + "\",";
   fullJson += "\"login\":\""   + login               + "\",";
   fullJson += "\"server\":\""  + EscapeJSON(server)  + "\",";
   fullJson += "\"currency\":\"" + AccountCurrency()  + "\",";
   fullJson += "\"balance\":"   + DoubleToStr(AccountBalance(), 2) + ",";
   fullJson += "\"tradeCount\":" + IntegerToString(count) + ",";
   fullJson += "\"trades\":"    + tradesJson;
   fullJson += "}";

   return(fullJson);
}

//+------------------------------------------------------------------+
string EscapeJSON(string s)
{
   StringReplace(s, "\\", "\\\\");
   StringReplace(s, "\"", "\\\"");
   StringReplace(s, "\n", "\\n");
   StringReplace(s, "\r", "\\r");
   StringReplace(s, "\t", "\\t");
   return(s);
}
//+------------------------------------------------------------------+
