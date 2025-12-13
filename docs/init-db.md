-- プレイヤー
players (
  id PK,
  member_id UNIQUE,      -- 難波店独自ID
  game_id,
  name,
  created_at
);

-- トーナメント定義（日付ごと）
tournaments (
  id PK,
  name,
  event_date,
  created_at
);

-- 来店（1日1プレイヤー1レコード）
visits (
  id PK,
  player_id FK,
  visit_date,
  entrance_fee,
  food_amount,
  discount_amount,
  created_at
);

-- トナメ参加
tournament_entries (
  id PK,
  visit_id FK,
  tournament_id FK,
  final_rank, -- 最終順位 
  bounty_count, -- 他人を飛ばした回数
  created_at

  UNIQUE (visit_id, tournament_id)
);

tournament_chip_events (
  id PK,
  tournament_entry_id FK,
  event_type,     -- ENTRY / REENTRY / ADD-ON
  chip_amount, -- 購入したチップ数
  created_at
);

-- リングゲーム参加
ring_game_entries (
  id PK,
  visit_id FK UNIQUE,
  created_at
);

-- リングゲームのチップの動きを記録する
ring_game_chip_events (
  id PK,
  ring_game_entry_id FK,
  event_type,     -- BUY_IN / CASH_OUT
  chip_amount, -- BUY_INのときは購入金額 CASH_OUTのときはゲットした金額
  created_at
);

-- 来店ごとの最終的な収支
settlements (
  id PK,
  visit_id FK,
  total_amount,          -- 最終収支（+/-）
  created_at
);

-- 店内コイン残高
store_coins (
  id PK,
  player_id FK,
  balance
);