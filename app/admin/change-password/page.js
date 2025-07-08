"use client";

import React, { useState } from "react";

const ChangePasswordPage = () => {
  const [username, setUsername] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!username || !oldPassword || !newPassword || !confirmPassword) {
      setError("All fields are required.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    setLoading(true);
    // First, check old password
    const res = await fetch("/api/admin-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password: oldPassword })
    });
    const data = await res.json();
    if (!data.success) {
      setError("Old password is incorrect.");
      setLoading(false);
      return;
    }
    // Now, update password
    const res2 = await fetch("/api/admin-auth", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, newPassword })
    });
    const data2 = await res2.json();
    if (data2.success) {
      setSuccess("Password changed successfully!");
      setUsername("");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      setError(data2.message || "Failed to change password.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <form onSubmit={handleChangePassword} className="bg-slate-900 p-8 rounded-xl shadow-xl w-full max-w-sm">
        <h2 className="text-2xl font-bold text-white mb-6">Change Password</h2>
        {error && <div className="mb-4 text-red-400">{error}</div>}
        {success && <div className="mb-4 text-green-400">{success}</div>}
        <input className="w-full mb-4 p-3 rounded bg-slate-800 text-white" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
        <input className="w-full mb-4 p-3 rounded bg-slate-800 text-white" placeholder="Old Password" type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} />
        <input className="w-full mb-4 p-3 rounded bg-slate-800 text-white" placeholder="New Password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
        <input className="w-full mb-4 p-3 rounded bg-slate-800 text-white" placeholder="Confirm New Password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
        <button className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 rounded" disabled={loading}>{loading ? "Changing..." : "Change Password"}</button>
      </form>
    </div>
  );
};

export default ChangePasswordPage;
