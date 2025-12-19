-- Tabela de eventos econômicos do Forex Factory
create table economic_events (
  id uuid primary key default gen_random_uuid(),
  
  -- Dados do evento
  date date not null,
  time text not null,                     -- "10:30am", "2:00pm", "All Day"
  currency text not null,                 -- "USD", "EUR", "GBP", "JPY"
  impact text not null,                   -- 'high' | 'medium' | 'low'
  event_name text not null,               -- "CPI y/y", "NFP", "FOMC"
  
  -- Valores (podem ser null antes do evento acontecer)
  actual text,
  forecast text,
  previous text,
  
  -- Metadata
  source text default 'forex_factory',
  
  -- Timestamps
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  
  -- Constraint: evento único por data+hora+moeda+nome
  constraint economic_events_date_time_unique unique (date, time, currency, event_name)
);

-- Índices para performance
create index idx_economic_events_date on economic_events(date);
create index idx_economic_events_currency on economic_events(currency);
create index idx_economic_events_impact on economic_events(impact);
create index idx_economic_events_date_currency on economic_events(date, currency);

-- RLS Policies (público para leitura)
alter table economic_events enable row level security;

create policy "Economic events são públicos"
  on economic_events for select
  using (true);  -- Todos podem ler

-- Apenas service role pode inserir/atualizar (via sync automático)
create policy "Apenas service role pode inserir"
  on economic_events for insert
  with check (auth.role() = 'service_role');

create policy "Apenas service role pode atualizar"
  on economic_events for update
  using (auth.role() = 'service_role');

-- Trigger para atualizar updated_at automaticamente
create trigger update_economic_events_updated_at
  before update on economic_events
  for each row
  execute function update_updated_at_column();

-- Comentários
comment on table economic_events is 'Calendário econômico do Forex Factory (eventos macroeconômicos)';
comment on column economic_events.impact is 'Impacto no mercado: high (vermelho), medium (amarelo), low (laranja)';
comment on column economic_events.time is 'Horário do evento no formato Forex Factory (ex: 10:30am)';
