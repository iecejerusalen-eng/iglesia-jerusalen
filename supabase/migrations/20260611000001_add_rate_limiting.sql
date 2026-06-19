-- Migration: Add Rate Limiting Table and check_rate_limit RPC Function

-- 1. Create the rate_limits table
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address text NOT NULL,
  endpoint text NOT NULL,
  request_count int DEFAULT 1 NOT NULL,
  window_start timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 2. Create unique index for atomic UPSERTs
CREATE UNIQUE INDEX IF NOT EXISTS rate_limits_ip_endpoint_idx ON public.rate_limits (ip_address, endpoint);

-- 3. Enable Row Level Security
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- 4. Restrict direct client-side read/write access (Only service_role can access)
CREATE POLICY "Restrict read to service role only" ON public.rate_limits
  FOR SELECT TO service_role USING (true);

CREATE POLICY "Restrict all to service role only" ON public.rate_limits
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 5. Create atomic rate limiting function
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  client_ip text,
  target_endpoint text,
  max_requests int,
  window_minutes int
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- runs with elevated privileges to bypass RLS on rate_limits
AS $$
DECLARE
  current_count int;
  window_boundary timestamp with time zone;
BEGIN
  window_boundary := now() - (window_minutes || ' minutes')::interval;
  
  -- Clean up expired entries for this specific IP/endpoint
  DELETE FROM public.rate_limits 
  WHERE ip_address = client_ip 
    AND endpoint = target_endpoint 
    AND window_start < window_boundary;

  -- Atomic Upsert
  INSERT INTO public.rate_limits (ip_address, endpoint, request_count, window_start)
  VALUES (client_ip, target_endpoint, 1, now())
  ON CONFLICT (ip_address, endpoint)
  DO UPDATE
  SET 
    request_count = CASE 
      WHEN rate_limits.window_start < window_boundary THEN 1 
      ELSE rate_limits.request_count + 1 
    END,
    window_start = CASE 
      WHEN rate_limits.window_start < window_boundary THEN now() 
      ELSE rate_limits.window_start 
    END
  RETURNING request_count INTO current_count;

  -- Return true if request count is within the limit, false if exceeded
  RETURN current_count <= max_requests;
END;
$$;

-- 6. Secure the execution permissions of the RPC function
REVOKE EXECUTE ON FUNCTION public.check_rate_limit(text, text, int, int) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_rate_limit(text, text, int, int) FROM anon;
REVOKE EXECUTE ON FUNCTION public.check_rate_limit(text, text, int, int) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, text, int, int) TO service_role;
