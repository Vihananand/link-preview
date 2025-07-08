"use client";

import React, { useState } from "react";

const AdminPage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [problems, setProblems] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({ serial: '', title: '', difficulty: '', topic: '', questionLink: '', solutionLink: '' });
  const [showCreate, setShowCreate] = useState(false);
  const [createData, setCreateData] = useState({ serial: '', title: '', difficulty: '', topic: '', questionLink: '', solutionLink: '' });

  // Create handlers
  const handleCreateChange = (e) => {
    setCreateData({ ...createData, [e.target.name]: e.target.value });
  };

  const saveCreate = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/problems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createData)
      });
      const data = await res.json();
      if (res.status === 409) {
        setError("Entry with this serial already exists.");
      } else if (data.success) {
        setShowCreate(false);
        setCreateData({ serial: '', title: '', difficulty: '', topic: '', questionLink: '', solutionLink: '' });
        fetchProblems();
      } else {
        setError(data.message || "Create failed");
      }
    } catch {
      setError("Create failed");
    }
    setLoading(false);
  };

  // Authentication handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.success) {
        setIsAuthenticated(true);
        fetchProblems();
      } else {
        setError(data.message || "Invalid credentials");
      }
    } catch (err) {
      setError("Login failed");
    }
    setLoading(false);
  };

  // Fetch problems
  const fetchProblems = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/problems");
      const data = await res.json();
      if (data.success) setProblems(data.problems);
      else setError("Failed to fetch problems");
    } catch {
      setError("Failed to fetch problems");
    }
    setLoading(false);
  };

  // Edit handlers
  const startEdit = (problem) => {
    setEditId(problem._id);
    setEditData({
      serial: problem.serial,
      title: problem.title,
      difficulty: problem.difficulty,
      topic: problem.topic,
      questionLink: problem.questionLink,
      solutionLink: problem.solutionLink
    });
  };

  const handleEditChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const saveEdit = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/problems", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: editId, ...editData })
      });
      const data = await res.json();
      if (data.success) {
        setEditId(null);
        fetchProblems();
      } else {
        setError(data.message || "Update failed");
      }
    } catch {
      setError("Update failed");
    }
    setLoading(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <form onSubmit={handleLogin} className="bg-slate-900 p-8 rounded-xl shadow-xl w-full max-w-sm">
          <h2 className="text-2xl font-bold text-white mb-6">Admin Login</h2>
          {error && <div className="mb-4 text-red-400">{error}</div>}
          <input className="w-full mb-4 p-3 rounded bg-slate-800 text-white" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
          <input className="w-full mb-4 p-3 rounded bg-slate-800 text-white" placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
          <button className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 rounded" disabled={loading}>{loading ? "Logging in..." : "Login"}</button>
        </form>
      </div>
    );
  }

  return (

    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <h1 className="text-3xl font-black bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">Admin Panel</h1>
        <a
          href="/admin/change-password"
          className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 text-lg"
        >
          Change Password
        </a>
      </div>
      {error && <div className="mb-4 text-red-400">{error}</div>}
      {loading && <div className="mb-4 text-cyan-400">Loading...</div>}

      <button className="mb-6 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded" onClick={() => setShowCreate(!showCreate)}>
        {showCreate ? "Cancel New Entry" : "Add New Problem"}
      </button>

      {showCreate && (
        <div className="bg-slate-900 rounded-xl p-6 shadow-lg mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Create New Problem</h2>
          <input className="w-full mb-2 p-2 rounded bg-slate-800 text-white" name="serial" placeholder="Serial" value={createData.serial} onChange={handleCreateChange} />
          <input className="w-full mb-2 p-2 rounded bg-slate-800 text-white" name="title" placeholder="Title" value={createData.title} onChange={handleCreateChange} />
          <select className="w-full mb-2 p-2 rounded bg-slate-800 text-white" name="difficulty" value={createData.difficulty} onChange={handleCreateChange}>
            <option value="">Select Difficulty</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
          <input className="w-full mb-2 p-2 rounded bg-slate-800 text-white" name="topic" placeholder="Topic" value={createData.topic} onChange={handleCreateChange} />
          <input className="w-full mb-2 p-2 rounded bg-slate-800 text-white" name="questionLink" placeholder="Question Link" value={createData.questionLink} onChange={handleCreateChange} />
          <input className="w-full mb-2 p-2 rounded bg-slate-800 text-white" name="solutionLink" placeholder="Solution Link" value={createData.solutionLink} onChange={handleCreateChange} />
          <button className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mr-2" onClick={saveCreate}>Create</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {problems.map(problem => (
          <div key={problem._id} className="bg-slate-900 rounded-xl p-6 shadow-lg">
            {editId === problem._id ? (
              <div>
                <input className="w-full mb-2 p-2 rounded bg-slate-800 text-white" name="serial" value={editData.serial} onChange={handleEditChange} />
                <input className="w-full mb-2 p-2 rounded bg-slate-800 text-white" name="title" value={editData.title} onChange={handleEditChange} />
                <select className="w-full mb-2 p-2 rounded bg-slate-800 text-white" name="difficulty" value={editData.difficulty} onChange={handleEditChange}>
                  <option value="">Select Difficulty</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
                <input className="w-full mb-2 p-2 rounded bg-slate-800 text-white" name="topic" value={editData.topic} onChange={handleEditChange} />
                <input className="w-full mb-2 p-2 rounded bg-slate-800 text-white" name="questionLink" value={editData.questionLink} onChange={handleEditChange} />
                <input className="w-full mb-2 p-2 rounded bg-slate-800 text-white" name="solutionLink" value={editData.solutionLink} onChange={handleEditChange} />
                <button className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mr-2" onClick={saveEdit}>Save</button>
                <button className="bg-slate-700 hover:bg-slate-800 text-white font-bold py-2 px-4 rounded" onClick={() => setEditId(null)}>Cancel</button>
              </div>
            ) : (
              <div>
                <div className="text-white font-bold text-lg mb-2">{problem.title}</div>
                <div className="text-slate-400 mb-1">Serial: {problem.serial}</div>
                <div className="text-slate-400 mb-1">Difficulty: {problem.difficulty}</div>
                <div className="text-slate-400 mb-1">Topic: {problem.topic}</div>
                <div className="text-slate-400 mb-1">Question: <a href={problem.questionLink} className="text-cyan-400 underline" target="_blank">Link</a></div>
                <div className="text-slate-400 mb-3">Solution: <a href={problem.solutionLink} className="text-purple-400 underline" target="_blank">Link</a></div>
                <button className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded mr-2 cursor-pointer" onClick={() => startEdit(problem)}>Edit</button>
                <button className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded cursor-pointer" onClick={async () => {
                  setLoading(true);
                  setError("");
                  try {
                    const res = await fetch(`/api/problems?id=${problem._id}`, { method: "DELETE" });
                    const data = await res.json();
                    if (data.success) {
                      fetchProblems();
                    } else {
                      setError(data.message || "Delete failed");
                    }
                  } catch {
                    setError("Delete failed");
                  }
                  setLoading(false);
                }}>Delete</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminPage;
