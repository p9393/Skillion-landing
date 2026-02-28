//+------------------------------------------------------------------+
//|  SkillionReporter.mq5                                            |
//|  Skillion Finance — Trade History Sync (MetaTrader 5)           |
//|  https://skillion.finance                                         |
//|                                                                  |
//|  INSTALLATION:                                                   |
//|  1. Copy this file to: MT5/MQL5/Experts/                        |
//|  2. Restart MT5 or press F5 in MetaEditor                       |
//|  3. Attach to any chart (e.g. EURUSD H1)                        |
//|  4. In "Inputs" tab, paste your Skillion Sync Token             |
//|  5. Enable "Allow WebRequests" for: https://skillion.finance    |
//+------------------------------------------------------------------+

#property copyright   "Skillion Finance"
#property link        "https://skillion.finance"
#property version     "1.0"
#property description "Syncs your MT5 deal history to Skillion to compute your SDI Score."

//--- Input parameters
input string SyncToken       = "";          // Skillion Sync Token (from your dashboard)
input int    SyncIntervalMin = 60;          // Sync interval in minutes (default: 60)
input bool   SyncOnStart     = true;        // Sync immediately on EA attach
input string ApiEndpoint     = "https://skillion.finance/api/mt4/sync";

//--- Global
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

   Comment("Skillion Reporter MT5 v" + eaVersion + " | Token: " + StringSubstr(SyncToken, 0, 8) + "...");
   Print("SkillionReporter MT5: Initialized. Token: ", StringSubstr(SyncToken, 0, 8), "...");

   if(SyncOnStart) SyncDeals();

   EventSetTimer(60);
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
void OnTimer()
{
   if(TimeCurrent() - lastSync >= SyncIntervalMin * 60)
      SyncDeals();
}

//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   EventKillTimer();
   Comment("");
}

//+------------------------------------------------------------------+
void SyncDeals()
{
   lastSync = TimeCurrent();
   Print("SkillionReporter MT5: Building deal payload...");

   // Request all history
   HistorySelect(0, TimeCurrent());

   string json = BuildDealJSON();
   if(json == "")
   {
      Print("SkillionReporter MT5: No closed deals found.");
      Comment("Skillion Reporter MT5 | No deals to sync yet.");
      return;
   }

   string headers = "Content-Type: application/json\r\nX-Skillion-Token: " + SyncToken + "\r\nX-Skillion-Platform: MT5";
   uchar  postData[];
   uchar  responseData[];
   string responseHeaders;

   StringToCharArray(json, postData, 0, StringLen(json));
   ArrayResize(postData, ArraySize(postData) - 1);

   Print("SkillionReporter MT5: Sending ", ArraySize(postData), " bytes to Skillion API...");

   int res = WebRequest("POST", ApiEndpoint, headers, 5000, postData, responseData, responseHeaders);

   if(res == 200)
   {
      string resp = CharArrayToString(responseData);
      Print("SkillionReporter MT5: Sync OK — ", resp);

      int sdiPos = StringFind(resp, "\"sdi\":");
      string sdiStr = "";
      if(sdiPos >= 0) sdiStr = " | SDI: " + StringSubstr(resp, sdiPos + 6, 6);

      Comment("Skillion Reporter MT5 v" + eaVersion + sdiStr + " | Last sync: " + TimeToString(TimeCurrent(), TIME_DATE|TIME_MINUTES));
   }
   else
   {
      Print("SkillionReporter MT5: Sync ERROR — HTTP ", res);
      Comment("Skillion Reporter MT5 | Sync error: HTTP " + IntegerToString(res));
   }
}

//+------------------------------------------------------------------+
string BuildDealJSON()
{
   string broker   = AccountInfoString(ACCOUNT_COMPANY);
   string login    = IntegerToString((long)AccountInfoInteger(ACCOUNT_LOGIN));
   string server   = AccountInfoString(ACCOUNT_SERVER);
   string currency = AccountInfoString(ACCOUNT_CURRENCY);
   double balance  = AccountInfoDouble(ACCOUNT_BALANCE);

   string tradesJson = "[";
   int    count      = 0;
   int    total      = HistoryDealsTotal();

   for(int i = 0; i < total; i++)
   {
      ulong ticket = HistoryDealGetTicket(i);
      if(ticket == 0) continue;

      // Only DEAL_TYPE_BUY / DEAL_TYPE_SELL (entry + close)
      ENUM_DEAL_TYPE dtype = (ENUM_DEAL_TYPE)HistoryDealGetInteger(ticket, DEAL_TYPE);
      if(dtype != DEAL_TYPE_BUY && dtype != DEAL_TYPE_SELL) continue;

      ENUM_DEAL_ENTRY dentry = (ENUM_DEAL_ENTRY)HistoryDealGetInteger(ticket, DEAL_ENTRY);
      if(dentry != DEAL_ENTRY_OUT && dentry != DEAL_ENTRY_INOUT) continue;

      if(count > 0) tradesJson += ",";

      string symbol     = HistoryDealGetString(ticket, DEAL_SYMBOL);
      double profit     = HistoryDealGetDouble(ticket, DEAL_PROFIT);
      double commission = HistoryDealGetDouble(ticket, DEAL_COMMISSION);
      double swap       = HistoryDealGetDouble(ticket, DEAL_SWAP);
      double price      = HistoryDealGetDouble(ticket, DEAL_PRICE);
      double volume     = HistoryDealGetDouble(ticket, DEAL_VOLUME);
      datetime time     = (datetime)HistoryDealGetInteger(ticket, DEAL_TIME);
      long posId        = HistoryDealGetInteger(ticket, DEAL_POSITION_ID);
      string comment    = HistoryDealGetString(ticket, DEAL_COMMENT);

      tradesJson += "{";
      tradesJson += "\"ticket\":"      + IntegerToString(ticket)                                      + ",";
      tradesJson += "\"positionId\":"  + IntegerToString(posId)                                       + ",";
      tradesJson += "\"symbol\":\""    + symbol                                                        + "\",";
      tradesJson += "\"type\":\""      + (dtype == DEAL_TYPE_BUY ? "buy" : "sell")                    + "\",";
      tradesJson += "\"lots\":"        + DoubleToString(volume, 2)                                     + ",";
      tradesJson += "\"closeTime\":"   + IntegerToString((int)time)                                    + ",";
      tradesJson += "\"closePrice\":"  + DoubleToString(price, 5)                                      + ",";
      tradesJson += "\"profit\":"      + DoubleToString(profit, 2)                                     + ",";
      tradesJson += "\"commission\":"  + DoubleToString(commission, 2)                                 + ",";
      tradesJson += "\"swap\":"        + DoubleToString(swap, 2)                                       + ",";
      tradesJson += "\"comment\":\""   + EscapeJSON(comment)                                           + "\"";
      tradesJson += "}";
      count++;
   }

   tradesJson += "]";
   if(count == 0) return("");

   string fullJson = "{";
   fullJson += "\"platform\":\"MT5\",";
   fullJson += "\"version\":\"" + eaVersion + "\",";
   fullJson += "\"broker\":\""   + EscapeJSON(broker)   + "\",";
   fullJson += "\"login\":\""    + login                 + "\",";
   fullJson += "\"server\":\""   + EscapeJSON(server)    + "\",";
   fullJson += "\"currency\":\""  + currency             + "\",";
   fullJson += "\"balance\":"    + DoubleToString(balance, 2) + ",";
   fullJson += "\"tradeCount\":"+  IntegerToString(count) + ",";
   fullJson += "\"trades\":"     + tradesJson;
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
