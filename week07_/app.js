const { useState } = React;

// Child Component (Table)
function StudentTable({ students, deleteStudent }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Age</th>
          <th>Course</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {students.map((s, index) => (
          <tr key={index}>
            <td>{s.name}</td>
            <td>{s.email}</td>
            <td>{s.age}</td>
            <td>{s.course}</td>
            <td>
              <button onClick={() => deleteStudent(index)}>
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Main Component
function App() {
  const [student, setStudent] = useState({
    name: "",
    email: "",
    age: "",
    course: ""
  });

  const [students, setStudents] = useState([]);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");

  // Handle input change (EVENT)
  const handleChange = (e) => {
    setStudent({ ...student, [e.target.name]: e.target.value });
  };

  // Validation
  const validate = () => {
    let newErrors = {};

    if (!student.name) newErrors.name = "Name required";
    if (!student.email.includes("@")) newErrors.email = "Invalid email";
    if (student.age < 18) newErrors.age = "Age must be ≥ 18";
    if (!student.course) newErrors.course = "Course required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit form (EVENT)
  const handleSubmit = (e) => {
    e.preventDefault();

    if (validate()) {
      setStudents([...students, student]);
      setStudent({ name: "", email: "", age: "", course: "" });
      setMessage("Student added successfully ✅");
    }
  };

  // Delete student (EVENT)
  const deleteStudent = (index) => {
    const updated = students.filter((_, i) => i !== index);
    setStudents(updated);
    setMessage("Student deleted ❌");
  };

  return (
    <div className="container">
      <h2>🎓 Student Record Manager (React)</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          placeholder="Name"
          value={student.name}
          onChange={handleChange}
        />
        <div className="error">{errors.name}</div>

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={student.email}
          onChange={handleChange}
        />
        <div className="error">{errors.email}</div>

        <input
          type="number"
          name="age"
          placeholder="Age"
          value={student.age}
          onChange={handleChange}
        />
        <div className="error">{errors.age}</div>

        <input
          type="text"
          name="course"
          placeholder="Course"
          value={student.course}
          onChange={handleChange}
        />
        <div className="error">{errors.course}</div>

        <button type="submit">Add Student</button>
      </form>

      <h3>{message}</h3>

      {students.length > 0 && (
        <StudentTable
          students={students}
          deleteStudent={deleteStudent}
        />
      )}
    </div>
  );
}

// Render
ReactDOM.createRoot(document.getElementById("root")).render(<App />);