export class Money {
  private constructor(private readonly cents: number) {}

  static fromCents(cents: number): Money {
    if (!Number.isFinite(cents) || Number.isNaN(cents) || !Number.isInteger(cents)) {
      throw new Error("Invalid money amount");
    }
    return new Money(cents);
  }

  static fromReais(value: string): Money {
    const match = /^-?\d+\.\d{2}$/.exec(value);
    if (!match) {
      throw new Error("Invalid money amount");
    }
    const negative = value.startsWith("-");
    const unsigned = negative ? value.slice(1) : value;
    const [reais, centavos] = unsigned.split(".");
    const total = Number.parseInt(reais, 10) * 100 + Number.parseInt(centavos, 10);
    return Money.fromCents(negative ? -total : total);
  }

  add(other: Money): Money {
    return Money.fromCents(this.cents + other.cents);
  }

  subtract(other: Money): Money {
    return Money.fromCents(this.cents - other.cents);
  }

  multiplyByQuantity(quantity: number): Money {
    if (!Number.isInteger(quantity) || quantity < 0) {
      throw new Error("Invalid quantity");
    }
    return Money.fromCents(this.cents * quantity);
  }

  compare(other: Money): -1 | 0 | 1 {
    if (this.cents < other.cents) return -1;
    if (this.cents > other.cents) return 1;
    return 0;
  }

  equals(other: Money): boolean {
    return this.cents === other.cents;
  }

  toCents(): number {
    return this.cents;
  }
}
