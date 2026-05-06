function ModePicker({ mode, onSelect }) {
    return (
        <div className="mode-picker">
            <button
                className={mode === "sort" ? "active" : ""}
                onClick={() => onSelect("sort")}
            >
                Array Sorting
            </button>
            <button
                className={mode === "graph" ? "active" : ""}
                onClick={() => onSelect("graph")}
            >
                Graphs
            </button>
            <button
                className={mode === "tree" ? "active" : ""}
                onClick={() => onSelect("tree")}
            >
                Trees
            </button>
        </div>
    )
}

export default ModePicker