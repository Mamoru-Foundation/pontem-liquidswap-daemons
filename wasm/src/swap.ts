import { CallTrace } from "@mamoru-ai/mamoru-aptos-sdk-as/assembly";
import { u128 } from "@mamoru-ai/mamoru-sdk-as/assembly";
import { findFollowingTraces } from "./common";

export function findReserveSizes(callTraces: CallTrace[], entryTrace: CallTrace): u128[] {
    const assertValueIncreasedTraces = findFollowingTraces(callTraces, entryTrace, "assert_lp_value_is_increased");

    if (assertValueIncreasedTraces.length != 1) {
        // something is wrong, the function should be called exactly once
        return [u128.Zero, u128.Zero, u128.Zero, u128.Zero];
    }

    const assertLpValueArgs = assertValueIncreasedTraces[0].args;

    if (assertLpValueArgs.length != 6) {
        // something is wrong, the function should have 6 arguments
        return [u128.Zero, u128.Zero, u128.Zero, u128.Zero];
    }

    // u128 are encoded as hex strings in Mamoru
    const xReserveOldHex = assertLpValueArgs[2].asU128();
    const yReserveOldHex = assertLpValueArgs[3].asU128();
    const xReserveNewHex = assertLpValueArgs[4].asU128();
    const yReserveNewHex = assertLpValueArgs[5].asU128();

    return [
        xReserveOldHex,
        yReserveOldHex,
        xReserveNewHex,
        yReserveNewHex,
    ]
}
