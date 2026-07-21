create table public.push_subscriptions (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    endpoint text not null,
    p256dh text not null,
    auth text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(endpoint)
);

-- Enable RLS
alter table public.push_subscriptions enable row level security;

-- Policies
create policy "Users can view their own subscriptions"
    on public.push_subscriptions for select
    using ((select auth.uid()) = user_id);

create policy "Users can insert their own subscriptions"
    on public.push_subscriptions for insert
    with check ((select auth.uid()) = user_id);

create policy "Users can update their own subscriptions"
    on public.push_subscriptions for update
    using ((select auth.uid()) = user_id);

create policy "Users can delete their own subscriptions"
    on public.push_subscriptions for delete
    using ((select auth.uid()) = user_id);

create policy "Admins can view all subscriptions"
    on public.push_subscriptions for select
    using (
        exists (
            select 1 from public.profiles
            where profiles.id = (select auth.uid()) and profiles.role = 'admin'
        )
    );

-- Trigger for updated_at
create trigger set_updated_at
  before update on public.push_subscriptions
  for each row execute function public.handle_updated_at();
