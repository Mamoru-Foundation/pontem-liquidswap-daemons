import { liquidityChangePercent } from "../../src";

describe("liquidity change", () => {
    test("10 added to 100 liquidity is 10%", () => {
        const percent = liquidityChangePercent(100, 10);

        expect(percent).toBe(10);
    });

    test("500 added to 1000 liquidity is 50%", () => {
        const percent = liquidityChangePercent(1000, 500);

        expect(percent).toBe(50);
    });

    test("10 removed from 100 liquidity is 10%", () => {
        const percent = liquidityChangePercent(100, -10);

        expect(percent).toBe(-10);
    });
});
