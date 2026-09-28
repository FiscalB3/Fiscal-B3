export type TimelineEventKind =
  | "BUY"
  | "SELL"
  | "SPLIT"
  | "GROUP"
  | "DIVIDENDO"
  | "JCP"
  | "RENDIMENTO_FII"
  | "DAY_TRADE";

export type TimelineEvent = {
  id: string;
  date: string;
  kind: TimelineEventKind;
  ticker: string;
  summary: string;
};

export interface GetTimeline {
  execute(): Promise<readonly TimelineEvent[]>;
}
