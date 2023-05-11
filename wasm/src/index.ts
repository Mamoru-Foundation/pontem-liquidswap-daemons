import { IncidentSeverity, report, u128 } from '@mamoru-ai/mamoru-sdk-as/assembly';
import { findBurnValues, findMintLpCoinTotal, findMintProvidedLiq } from "./liquidity";
import { findReserveSizes } from "./swap";
import { AptosCtx } from "@mamoru-ai/mamoru-aptos-sdk-as/assembly"

// Liquidswap package id in Aptos Mainnet
const PACKAGE_ID: string = "0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12";

export function main(): void {
    const ctx = AptosCtx.load();

    for (let i = 0; i < ctx.txs.length; i++) {
        const tx = ctx.txs[i];

        const entryFunctionTraces = tx.callTraces.filter((ct) => {
            const isLiquidityPool = ct.transactionModule == `${PACKAGE_ID}::liquidity_pool`
            const isRequiredFunction = ct.func == "mint" || ct.func == "burn" || ct.func == "swap"

            return isLiquidityPool && isRequiredFunction
        });

        if (entryFunctionTraces.length == 0) {
            // No calls found, nothing to do
            return;
        }

        // It is possible that we have a few calls in the same tx, so using a loop
        for (let i = 0; i < entryFunctionTraces.length; i++) {
            const entryTrace = entryFunctionTraces[i];

            if (entryTrace.func == "swap") {
                const reserveSizes = findReserveSizes(tx.callTraces, entryTrace);

                const xReserveOld = reserveSizes[0];
                const yReserveOld = reserveSizes[1];
                const xReserveNew = reserveSizes[2];
                const yReserveNew = reserveSizes[3];

                if (xReserveOld == u128.Zero || xReserveNew == u128.Zero || yReserveOld == u128.Zero || yReserveNew == u128.Zero) {
                    return;
                }

                const oldPrice = xReserveOld / yReserveOld;
                const newPrice = xReserveNew / yReserveNew;

                // assuming that price is x/y
                if (tradePriceChangePercent(oldPrice, newPrice) > u128.from(10)) {
                    report(IncidentSeverity.Warning, "Trade that influence price to drop more than 10%");
                    return;
                }
            }

            if (entryTrace.func == "mint") {
                let lpCoinTotal = findMintLpCoinTotal(tx.callTraces, entryTrace);
                let providedLiq = findMintProvidedLiq(tx.callTraces, entryTrace);

                if (lpCoinTotal == -1 || providedLiq == -1) {
                    return;
                }

                if (liquidityChangePercent(lpCoinTotal, providedLiq) > 10) {
                    report(IncidentSeverity.Info, "Big liquidity add to a pool (increase more than 10%)");

                    return;
                }
            }

            if (entryTrace.func == "burn") {
                const burnValues = findBurnValues(tx.callTraces, entryTrace);
                const burnedLiq = burnValues[0];
                const lpCoinsTotal = burnValues[1];

                if (burnedLiq == -1 || lpCoinsTotal == -1) {
                    return;
                }

                if (liquidityChangePercent(lpCoinsTotal, -burnedLiq) < -10) {
                    report(IncidentSeverity.Warning, "Big liquidity removal from a pool (decrease more than 10%)");

                    return;
                }
            }
        }
    }
}

export function liquidityChangePercent(total: i64, change: i64): f64 {
    return (change as f64 * 100) / (total as f64);
}

export function tradePriceChangePercent(oldPrice: u128, newPrice: u128): u128 {
    if (oldPrice == newPrice) {
        return u128.Zero;
    }

    let diff: u128;

    if (oldPrice > newPrice) {
        diff = oldPrice - newPrice;
    } else {
        diff = newPrice - oldPrice;
    }

    return (diff * u128.from(100)) / oldPrice;
}
