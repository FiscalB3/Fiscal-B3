import type { Money } from "../../domain/money/Money";

export type DarfObligation = {
  month: string;
  darf: Money;
  dueDate: string;
};

export interface GetDarfCalendar {
  execute(input?: { year?: number }): Promise<readonly DarfObligation[]>;
}
