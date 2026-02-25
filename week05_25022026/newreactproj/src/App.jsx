import { useState } from "react";
import "./App.css";

function App() {
  const [student, setStudent] = useState("");
  const [scholarship, setScholarship] = useState("");
  const [data, setData] = useState([]);

  const addEntry = () => {
    if (student && scholarship) {
      setData([...data, { student, scholarship }]);
      setStudent("");
      setScholarship("");
    }
  };

  const deleteEntry = (index) => {
    const newData = data.filter((_, i) => i !== index);
    setData(newData);
  };

  return (
    <div className="container">
      <h1>Scholarship Tracker</h1>

      <input
        type="text"
        placeholder="Student Name"
        value={student}
        onChange={(e) => setStudent(e.target.value)}
      />

      <input
        type="text"
        placeholder="Scholarship Name"
        value={scholarship}
        onChange={(e) => setScholarship(e.target.value)}
      />

      <button onClick={addEntry}>Add</button>

      <ul>
        {data.map((item, index) => (
          <li key={index}>
            {item.student} — {item.scholarship}
            <button onClick={() => deleteEntry(index)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;