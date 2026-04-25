function AlgorithmPicker({ algorithm, onSelect }) {
    // destructing props object, called in App by:
    // <AlgorithmPicker algorithm="bubble" onSelect={handleSelect} /> ... unpacked by { }
    return (
        <div className="algorithm-picker">
            <button
                className={algorithm === "bubble" ? "active" : ""} // add active class
                onClick={() => onSelect("bubble")} // () => is a quick function declaration
            >
                Bubble Sort
            </button>
            <button
                className={algorithm === "merge" ? "active" : ""}
                onClick={() => onSelect("merge")}
            >
                Merge Sort
            </button>
        </div>
    )
}

export default AlgorithmPicker