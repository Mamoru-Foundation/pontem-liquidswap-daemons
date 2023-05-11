import { JSON } from "assemblyscript-json/assembly";

export function findCallTraces(callTraces: JSON.Obj[], depth: i64, func: string): JSON.Obj[] {
    let found = new Array<JSON.Obj>();

    for (let i = 0; i < callTraces.length; i++) {
        const trace = callTraces[i];
        const traceDepth = trace.getInteger("depth")!.valueOf();
        const traceFunc = trace.getString("function")!.valueOf();

        if (traceDepth == depth && traceFunc == func) {
            found.push(trace);
        }
    }

    return found;

}
