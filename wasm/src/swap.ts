import { JSON } from "assemblyscript-json/assembly";
import { u128 } from "as-bignum/assembly";
import { query } from "@mamoru-ai/mamoru-sdk-as/assembly";

export function findReserveSizes(callTraces: JSON.Obj[], baseDepth: i64): u128[] {
    let txSeq = callTraces[0].getInteger("tx_seq")!.valueOf();
    let assertLpValueArgs = query(`
            SELECT as_string(cta.arg) as arg
            FROM call_trace_args cta
            INNER JOIN call_traces ct ON ct.seq = cta.call_trace_seq
            WHERE
                ct.function = "assert_lp_value_is_increased" AND
                ct.tx_seq = ${txSeq} AND
                ct.depth = ${baseDepth} + 1`
    );

    if (assertLpValueArgs.length != 6) {
        // something is wrong, the function should have 6 arguments
        return [u128.Zero, u128.Zero, u128.Zero, u128.Zero];
    }

    // u128 are encoded as hex string in Mamoru
    const xReserveOldHex = assertLpValueArgs[2].getString("arg")!.valueOf();
    const yReserveOldHex = assertLpValueArgs[3].getString("arg")!.valueOf();
    const xReserveNewHex = assertLpValueArgs[4].getString("arg")!.valueOf();
    const yReserveNewHex = assertLpValueArgs[5].getString("arg")!.valueOf();

    return [
        u128.from(xReserveOldHex),
        u128.from(yReserveOldHex),
        u128.from(xReserveNewHex),
        u128.from(yReserveNewHex),
    ]
}
