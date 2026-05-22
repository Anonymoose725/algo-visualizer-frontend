import bubbleSteps from "./bubble.json"
import mergeSteps from "./merge.json"
import insertionSteps from "./insertion.json"
import bstInsert from "./bst-insert.json"
import bstSearch from "./bst-search.json"
import dijkstra from "./dijkstra.json"
import dfs from "./dfs.json"

export const demoData = {
    bubble: { steps: bubbleSteps, input: "8,3,6,1,5,2,7,4" },
    merge: { steps: mergeSteps, input: "8,3,6,1,5,2,7,4" },
    insertion: { steps: insertionSteps, input: "8,3,6,1,5,2,7,4" },
    "bst-insert": { response: bstInsert, input: "5,3,7,1,4,6,8" },
    "bst-search": { response: bstSearch, input: "5,3,7,1,4,6,8", target: "4" },
    "dijkstra": { response: dijkstra },
    "dfs": { response: dfs }
}

