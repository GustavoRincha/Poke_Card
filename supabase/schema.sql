-- ==============================================================================
-- PokeCard - Esquema de Banco de Dados Supabase (PostgreSQL)
-- Execute este script no SQL Editor do seu projeto Supabase
-- ==============================================================================

-- 1. Extensões úteis
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. Tabela de Perfis de Usuário (profiles)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Ativa RLS em profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para profiles
CREATE POLICY "Perfis visíveis publicamente ou autenticados" 
  ON public.profiles FOR SELECT 
  USING (true);

CREATE POLICY "Usuário pode atualizar seu próprio perfil" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- ==============================================================================
-- 3. Tabela de Coleção de Cartas (collections)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.collections (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  card_id TEXT NOT NULL,
  quantity INTEGER DEFAULT 1 NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  PRIMARY KEY (user_id, card_id)
);

-- Ativa RLS em collections
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para collections (Apenas o próprio usuário acessa suas cartas)
CREATE POLICY "Usuário pode visualizar sua própria coleção" 
  ON public.collections FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Usuário pode inserir itens em sua coleção" 
  ON public.collections FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuário pode atualizar itens em sua coleção" 
  ON public.collections FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Usuário pode deletar itens de sua coleção" 
  ON public.collections FOR DELETE 
  USING (auth.uid() = user_id);

-- ==============================================================================
-- 4. Tabela de Lista de Desejos (wishlists)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.wishlists (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  card_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  PRIMARY KEY (user_id, card_id)
);

-- Ativa RLS em wishlists
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para wishlists
CREATE POLICY "Usuário pode visualizar sua própria lista de desejos" 
  ON public.wishlists FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Usuário pode adicionar itens aos desejos" 
  ON public.wishlists FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuário pode remover itens dos desejos" 
  ON public.wishlists FOR DELETE 
  USING (auth.uid() = user_id);

-- ==============================================================================
-- 5. Função RPC: Buscar e-mail por username (utilizado no login)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.get_email_by_username(username_input TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  found_email TEXT;
BEGIN
  SELECT email INTO found_email
  FROM public.profiles
  WHERE LOWER(username) = LOWER(TRIM(username_input))
  LIMIT 1;

  RETURN found_email;
END;
$$;

-- ==============================================================================
-- 6. Trigger para sincronizar novo usuário criado em auth.users com profiles
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, first_name, last_name, email)
  VALUES (
    NEW.id,
    COALESCE(LOWER(NEW.raw_user_meta_data->>'username'), SPLIT_PART(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.email
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    username = EXCLUDED.username,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    email = EXCLUDED.email,
    updated_at = NOW();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
