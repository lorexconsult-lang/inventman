import { describe, expect, it } from "vitest";
import { mapBankCsv, parseCsv } from "./csv";
describe("bank CSV", () => { it("parses quoted fields", () => expect(parseCsv('date,description,amount\n2026-08-01,"Fee, monthly",-5')).toEqual([["date","description","amount"],["2026-08-01","Fee, monthly","-5"]])); it("maps configured columns", () => expect(mapBankCsv("When,Value,Memo\n2026-01-01,12,Receipt", { date: "When", amount: "Value", reference: "", description: "Memo" })[0]).toEqual({ date: "2026-01-01", amount: "12", reference: "", description: "Receipt" })); });
