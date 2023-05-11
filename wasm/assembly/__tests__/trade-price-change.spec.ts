import { tradePriceChangePercent } from "../../src";
import { u128 } from "as-bignum/assembly";

describe("trade price change", () => {
    test("100 -> 90 is 10%", () => {
        const percent = tradePriceChangePercent(u128.from(100), u128.from(90));

        expect(percent).toBe(u128.from(10));
    });

    test("100 -> 110 is 10%", () => {
        const percent = tradePriceChangePercent(u128.from(100), u128.from(110));

        expect(percent).toBe(u128.from(10));
    });
});
