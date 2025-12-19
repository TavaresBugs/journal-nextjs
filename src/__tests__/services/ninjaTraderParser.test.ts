import { describe, it, expect } from "vitest";
import { detectColumnMapping } from "../../services/trades/importParsers";
import {
  cleanSymbol,
  normalizeTradeType,
  parseNinjaTraderContent,
  parseNinjaTraderDate,
  parseNinjaTraderPrice,
  parseNinjaTraderMoney,
} from "../../services/trades/import";

describe("NinjaTrader Import Logic", () => {
  describe("English Format Support", () => {
    it("parses English dates (MM/dd/yyyy AM/PM)", () => {
      const dateStr = "12/19/2024 8:44:03 AM";
      const date = parseNinjaTraderDate(dateStr);
      expect(date).not.toBeNull();
      expect(date?.getFullYear()).toBe(2024);
      expect(date?.getMonth()).toBe(11); // Dec
      expect(date?.getDate()).toBe(19);
      expect(date?.getHours()).toBe(8);
    });

    it("parses English prices (dot decimal)", () => {
      expect(parseNinjaTraderPrice("21715.25")).toBe(21715.25);
    });

    it("parses English money (dot decimal)", () => {
      expect(parseNinjaTraderMoney("110.00")).toBe(110.0);
      expect(parseNinjaTraderMoney("-3.10")).toBe(-3.1);
      expect(parseNinjaTraderMoney("$110.00")).toBe(110.0);
    });
  });

  describe("detectColumnMapping", () => {
    it("detects English NinjaTrader headers", () => {
      const headers = [
        "Trade number",
        "Instrument",
        "Account",
        "Strategy",
        "Market pos.",
        "Qty",
        "Entry price",
        "Exit price",
        "Entry time",
        "Exit time",
      ];

      const mapping = detectColumnMapping(headers);

      expect(mapping.symbol).toBe("Instrument");
      expect(mapping.direction).toBe("Market pos.");
      expect(mapping.volume).toBe("Qty");
      expect(mapping.entryPrice).toBe("Entry price");
      expect(mapping.exitPrice).toBe("Exit price");
      expect(mapping.entryDate).toBe("Entry time");
      expect(mapping.exitDate).toBe("Exit time");
    });
  });

  describe("cleanSymbol", () => {
    it("cleans standard NinjaTrader format (MNQ 12-25)", () => {
      expect(cleanSymbol("MNQ 12-25")).toBe("MNQ");
    });

    it("cleans English NinjaTrader format (NQ DEC25)", () => {
      expect(cleanSymbol("NQ DEC25")).toBe("NQ");
      expect(cleanSymbol("MNQ DEC25")).toBe("MNQ");
      expect(cleanSymbol("MES MAR26")).toBe("MES");
    });

    it("handles symbols without date", () => {
      expect(cleanSymbol("EURUSD")).toBe("EURUSD");
    });

    it("cleans MetaTrader symbols", () => {
      expect(cleanSymbol("EURUSD.cash")).toBe("EURUSD");
    });
  });

  describe("normalizeTradeType", () => {
    it("normalizes English types", () => {
      expect(normalizeTradeType("Long")).toBe("Long");
      expect(normalizeTradeType("Short")).toBe("Short");
    });

    it("normalizes Portuguese types", () => {
      expect(normalizeTradeType("Comprada")).toBe("Long");
      expect(normalizeTradeType("Venda")).toBe("Short");
    });

    it("is case insensitive", () => {
      expect(normalizeTradeType("long")).toBe("Long");
      expect(normalizeTradeType("short")).toBe("Short");
      expect(normalizeTradeType("comprada")).toBe("Long");
    });
  });

  describe("parseNinjaTraderContent", () => {
    it("parses semicolon delimiter (PT)", () => {
      const csv = `Núm. Neg.;Ativo;Conta;Estratégia;Pos mercado.;Qtd;Preço entrada;Preço saída;Hora entrada;Hora saída;Entrada;Sáída;Profit;Acu lucro líquido;Corretagem;MAE;MFE;ETD;Barras;
1;MNQ 12-25;Sim101;;Comprada;1;21160,50;21165,50;06/12/2024 09:30:00;06/12/2024 09:31:00;Entry;Exit;10,00;10,00;0,00;0;0;0;10;`;
      const result = parseNinjaTraderContent(csv);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]["Núm. Neg."]).toBe("1");
      expect(result.data[0]["Ativo"]).toBe("MNQ 12-25");
    });

    it("parses comma delimiter (EN)", () => {
      const csv = `Trade number,Instrument,Account,Strategy,Market pos.,Qty,Entry price,Exit price,Entry time,Exit time,Entry name,Exit name,Profit,Cum. net profit,Commission,Clearing Fee,Exchange Fee,IP Fee,NFA Fee,MAE,MFE,ETD,Bars
1,NQ DEC25,APEX3264990000015,,Long,2,21715.25,21718.00,12/19/2024 8:44:03 AM,12/19/2024 8:44:59 AM,Entry,Exit,110.00,103.80,3.10,0.50,1.52,0.98,0.10,0.00,10.75,0.00,56`;
      const result = parseNinjaTraderContent(csv);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]["Trade number"]).toBe("1");
      expect(result.data[0]["Instrument"]).toBe("NQ DEC25");
      expect(result.data[0]["Qty"]).toBe("2");
    });
  });
});
