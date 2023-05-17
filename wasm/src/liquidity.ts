import { findFollowingTraces } from "./common";
import { CallTrace } from "@mamoru-ai/mamoru-aptos-sdk-as/assembly";

export function findBurnValues(callTraces: CallTrace[], entryTrace: CallTrace): i64[] {
    let mulDiv128Calls = findFollowingTraces(callTraces, entryTrace, "mul_div_u128")

    if (mulDiv128Calls.length == 0) {
        // that's odd, the call should be there anyway
        return [-1, -1];
    }

    const mulDivArgs = mulDiv128Calls[0].args;
    // `mul_div_u128` accepts 3 arguments
    if (mulDivArgs.length != 3) {
        return [-1, -1];
    }

    const burnedLiq = mulDivArgs[0].asU64();
    const lpCoinsTotal = mulDivArgs[2].asU64();

    return [
        burnedLiq,
        lpCoinsTotal,
    ];
}

export function findMintLpCoinTotal(callTraces: CallTrace[], entryTrace: CallTrace): i64 {
    // We only can see call traces from VM
    // Looking for `mul_div_u128` call, as `lp_coins_total` is passed to that function
    const mulDiv128Calls = findFollowingTraces(callTraces, entryTrace, "mul_div_u128")

    // this is a new pool, `mul_div_u128` is not called
    if (mulDiv128Calls.length == 0) {
        return -1;
    }

    const mulDivArgs = mulDiv128Calls[0].args;
    // `mul_div_u128` accepts 3 arguments
    if (mulDivArgs.length != 3) {
        return -1;
    }

    return mulDivArgs[1].asU64();
}

export function findMintProvidedLiq(callTraces: CallTrace[], entryTrace: CallTrace): i64 {
    const mintCalls = findFollowingTraces(callTraces, entryTrace, "mint");

    if (mintCalls.length == 0) {
        return -1;
    }

    const mintArgs = mintCalls[0].args;

    // `mint` accepts 2 arguments
    if (mintArgs.length != 2) {
        return -1;
    }

    return mintArgs[0].asU64()
}
