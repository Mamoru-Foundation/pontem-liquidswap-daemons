import { CallTrace } from "@mamoru-ai/mamoru-aptos-sdk-as/assembly";

export function findFollowingTraces(callTraces: CallTrace[], entryTrace: CallTrace, func: string): CallTrace[] {
    let found = new Array<CallTrace>();

    for (let i = 0; i < callTraces.length; i++) {
        const trace = callTraces[i];

        // Following traces are:
        // - called after entry trace
        // - are deeper in the call stack
        if (trace.seq > entryTrace.seq && trace.depth == (entryTrace.depth + 1) && trace.func == func) {
            found.push(trace);
        }
    }

    return found;

}
