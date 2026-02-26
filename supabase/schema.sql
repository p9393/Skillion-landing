-- Configurazione Database Skillion (Supabase)

-- 1. Tabelle principali

-- Profili utente (estende auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_activated BOOLEAN DEFAULT FALSE,  -- admin attiva manualmente
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lista d'attesa (Waitlist)
CREATE TABLE IF NOT EXISTS public.waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'invited', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fonti dati collegate (Exchange, Wallet, Broker)
CREATE TABLE IF NOT EXISTS public.data_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  source_type TEXT CHECK (source_type IN ('cefi','defi','broker','upload')),
  provider TEXT,  -- es. binance, bybit, mt4, ibkr, csv
  verification_level TEXT CHECK (verification_level IN ('api','signature','statement','manual')),
  status TEXT CHECK (status IN ('connected','pending','error')),
  metadata JSONB,  -- contenitore flessibile: encrypted API keys ref, wallet address
  last_sync TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Statement uploadati (broker tradizionali / fase 1)
CREATE TABLE IF NOT EXISTS public.broker_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  source_id UUID REFERENCES public.data_sources(id) ON DELETE CASCADE,
  filename TEXT,
  format TEXT,  -- csv, html, pdf, mt4, mt5
  file_path TEXT,  -- Supabase storage path
  checksum TEXT,
  status TEXT CHECK (status IN ('uploaded','parsing','parsed','error')),
  parse_result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trade normalizzati (Standard Trade Object)
CREATE TABLE IF NOT EXISTS public.trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  source_id UUID REFERENCES public.data_sources(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ,
  symbol TEXT,
  direction TEXT CHECK (direction IN ('long','short')),
  size NUMERIC,
  entry_price NUMERIC,
  exit_price NUMERIC,
  pnl NUMERIC,
  fees NUMERIC,
  leverage NUMERIC,
  duration_ms BIGINT,
  raw JSONB, -- Dati raw originali della transazione
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Trigger per auto-creare il Profile alla registrazione Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, is_activated)
  VALUES (new.id, new.email, FALSE);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Row Level Security (RLS) Policies

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

-- Profiles: l'utente puo' leggere solo il proprio, gli admin leggono tutto
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING ( auth.uid() = id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' );

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING ( auth.uid() = id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' );

-- Admins can update their role or others (Supabase dashboard will also be used initially)

-- Waitlist: Solo gli admin possono leggere/modificare. Insert e' publico (o via API key).
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view waitlist"
ON public.waitlist FOR SELECT
USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' );

CREATE POLICY "Admins can update waitlist"
ON public.waitlist FOR UPDATE
USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' );

CREATE POLICY "Anyone can insert into waitlist"
ON public.waitlist FOR INSERT
WITH CHECK ( true );

-- Data Sources: utente legge/modifica/crea i propri
CREATE POLICY "Users can view own data sources"
ON public.data_sources FOR SELECT
USING ( auth.uid() = user_id );

CREATE POLICY "Users can insert own data sources"
ON public.data_sources FOR INSERT
WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "Users can update own data sources"
ON public.data_sources FOR UPDATE
USING ( auth.uid() = user_id );

-- Broker Statements:
CREATE POLICY "Users can view own statements"
ON public.broker_statements FOR SELECT
USING ( auth.uid() = user_id );

CREATE POLICY "Users can insert own statements"
ON public.broker_statements FOR INSERT
WITH CHECK ( auth.uid() = user_id );

-- Trades:
CREATE POLICY "Users can view own trades"
ON public.trades FOR SELECT
USING ( auth.uid() = user_id );

CREATE POLICY "Users can insert own trades"
ON public.trades FOR INSERT
WITH CHECK ( auth.uid() = user_id );
