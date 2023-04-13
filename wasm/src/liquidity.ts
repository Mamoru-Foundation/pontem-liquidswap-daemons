import { JSON } from "assemblyscript-json/assembly";
import { findCallTraces } from "./common";
import { query } from "@mamoru-ai/mamoru-sdk-as/assembly";

export function findBurnValues(callTraces: JSON.Obj[], baseDepth: i64): i64[] {
    let mulDiv128Calls = findCallTraces(callTraces, baseDepth + 1, "mul_div_u128")

    if (mulDiv128Calls.length == 0) {
        // that's odd, the call should be there anyway

        return [-1, -1];
    }

    const mulDivTrace = mulDiv128Calls[0];
    const mulDivTraceSeq = mulDivTrace.getInteger("call_trace_seq")!.valueOf();

    const mulDivArgs = query(`SELECT as_uint64(cta.arg) as arg FROM call_trace_args cta WHERE cta.call_trace_seq = ${mulDivTraceSeq}`);

    // `mul_div_u128` accepts 3 arguments
    if (mulDivArgs.length != 3) {
        return [-1, -1];
    }

    const burnedLiq = mulDivArgs[0];
    const lpCoinsTotal = mulDivArgs[2];

    return [
        burnedLiq.getInteger("arg")!.valueOf(),
        lpCoinsTotal.getInteger("arg")!.valueOf(),
    ];
}

export function findMintLpCoinTotal(callTraces: JSON.Obj[], baseDepth: i64): i64 {
    // We only can see call traces from VM
    // Looking for `mul_div_u128` call, as `lp_coins_total` is passed to that function
    const mulDiv128Calls = findCallTraces(callTraces, baseDepth + 1, "mul_div_u128")

    // this is a new pool, `mul_div_u128` is not called
    if (mulDiv128Calls.length == 0) {
        return -1;
    }

    const mulDivTrace = mulDiv128Calls[0];
    const mulDivTraceSeq = mulDivTrace.getInteger("call_trace_seq")!.valueOf();

    const mulDivArgs = query(`SELECT as_uint64(cta.arg) as arg FROM call_trace_args cta WHERE cta.call_trace_seq = ${mulDivTraceSeq}`);

    // `mul_div_u128` accepts 3 arguments
    if (mulDivArgs.length != 3) {
        return -1;
    }

    const lpCoinsTotal = mulDivArgs[1];

    return lpCoinsTotal.getInteger("arg")!.valueOf();
}

export function findMintProvidedLiq(callTraces: JSON.Obj[], baseDepth: i64): i64 {
    const mintCalls = findCallTraces(callTraces, baseDepth + 1, "mint");

    if (mintCalls.length == 0) {
        return -1;
    }

    const mintTrace = mintCalls[0];
    const mintTraceSeq = mintTrace.getInteger("call_trace_seq")!.valueOf();
    const mintArgs = query(`SELECT as_uint64(cta.arg) as arg FROM call_trace_args cta WHERE cta.call_trace_seq = ${mintTraceSeq}`);

    // `mint` accepts 2 arguments
    if (mintArgs.length != 2) {
        return -1;
    }

    const providedLiq = mintArgs[0];

    return providedLiq.getInteger("arg")!.valueOf();
}
