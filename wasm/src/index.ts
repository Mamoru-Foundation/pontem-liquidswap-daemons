import { report, IncidentSeverity, query } from '@mamoru-ai/mamoru-sdk-as/assembly';
import { u128 } from "as-bignum/assembly";
import { findBurnValues, findMintLpCoinTotal, findMintProvidedLiq } from "./liquidity";
import { findReserveSizes } from "./swap";

// Liquidswap package id in Aptos Mainnet
const PACKAGE_ID: string = "0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12";

// Returns all call traces of a transaction
// if `mint` or `burn` call is found in the transaction
const QUERY: string = `
    WITH liquidity_pool_call AS (
        SELECT 
            ct.function, ct.depth, ct.tx_seq FROM call_traces ct
        WHERE
            ct.transaction_module = "${PACKAGE_ID}::liquidity_pool" AND
            ct.function = "mint" OR ct.function = "burn" OR ct.function = "swap"
    )

    SELECT 
        ct.*,
        liquidity_pool_call.function AS called_function,
        liquidity_pool_call.depth AS called_function_depth
    FROM 
        call_traces ct
    WHERE 
        liquidity_pool_call IS NOT NULL AND ct.tx_seq = liquidity_pool_call.tx_seq
`;

export function main(): void {
    let callTraces = query(QUERY);

    if (callTraces.length == 0) {
        // No calls found, nothing to do
        return;
    }

    let functionName = callTraces[0].getString("called_function")!.valueOf();
    let baseDepth = callTraces[0].getInteger("called_function_depth")!.valueOf();

    if (functionName == "swap") {
        const reserveSizes = findReserveSizes(callTraces, baseDepth);

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

    if (functionName == "mint") {
        let lpCoinTotal = findMintLpCoinTotal(callTraces, baseDepth)
        let providedLiq = findMintProvidedLiq(callTraces, baseDepth);

        if (lpCoinTotal == -1 || providedLiq == -1) {
            return;
        }

        if (liquidityChangePercent(lpCoinTotal, providedLiq) > 10) {
            report(IncidentSeverity.Info, "Big liquidity add to a pool (increase more than 10%)");

            return;
        }
    }

    if (functionName == "burn") {
        const burnValues = findBurnValues(callTraces, baseDepth);
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
