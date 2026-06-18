-- ============================================
-- iChama: complete schema fix migration
-- Run this once in Supabase SQL editor
-- ============================================

-- chamas: needed by create-chama.html, chama.html, join-chama.html, members.html
alter table chamas add column if not exists invite_code text unique;
alter table chamas add column if not exists approvals_required integer default 2;

-- withdrawals: needed by withdraw.html, vote.html (payout destination)
alter table withdrawals add column if not exists destination text;

-- withdrawal_approvals: needed by withdraw.html, vote.html
-- (original schema only had approved_by; pages use user_id + chama_id)
alter table withdrawal_approvals add column if not exists user_id uuid references profiles(id);
alter table withdrawal_approvals add column if not exists chama_id uuid references chamas(id);

-- contributions: needed by contribute.html, profile.html, members.html
alter table contributions add column if not exists method text;
alter table contributions add column if not exists reference text;
alter table contributions add column if not exists note text;

-- notification_preferences: new table for notifications.html
create table if not exists notification_preferences (
  user_id uuid references profiles(id) on delete cascade primary key,
  withdraw_request boolean default true,
  approval_needed boolean default true,
  payment_reminder boolean default true,
  penalty_alert boolean default true,
  new_member boolean default true,
  updated_at timestamp default now()
);
