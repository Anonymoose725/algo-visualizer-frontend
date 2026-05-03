import { useState } from "react"

function BSTControls({ bstMode, setBstMode, bstTarget, setBstTarget, onVisualize }) {
    const [inputValue, setInputValue] = useState("")

    function handleVisualize() {
        if (inputValue) onVisualize(inputValue)
    }

    function loadDemo() {
        if (bstMode === "search") {
            setInputValue("5,3,7,1,4,6,8")
            setBstTarget("4")
            onVisualize("5,3,7,1,4,6,8")
        } else {
            setInputValue("5,3,7,1,4,6,8")
            onVisualize("5,3,7,1,4,6,8")
        }
    }

    return (
        <div className="bst-controls">
            <div className="algorithm-picker">
                <button
                    className={bstMode === "insert" ? "active" : ""}
                    onClick={() => setBstMode("insert")}
                >
                    Insert
                </button>

                <button
                    className={bstMode === "search" ? "active" : ""}
                    onClick={() => setBstMode("search")}
                >
                    Search
                </button>

                <button
                    className={bstMode === "build" ? "active" : ""}
                    onClick={() => setBstMode("build")}
                >
                    Build
                </button>
            </div>

            <div className="array-input">
                <input
                    type="text"
                    placeholder="e.g. 5,3,7,1,4"
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                />

                {bstMode === "search" && (
                    <input
                        type="text"
                        placeholder="target"
                        value={bstTarget}
                        onChange={e => setBstTarget(e.target.value)}
                        style={{ width: "80px" }}
                    />
                )}

                <button onClick={handleVisualize} disabled={!inputValue}>
                    Visualize
                </button>

                <button onClick={loadDemo}>
                    Load demo
                </button>

            </div>
        </div>
    )
}

export default BSTControls