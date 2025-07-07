"use client";

import React, { useEffect, useState, useRef } from "react";
import { Database } from "lucide-react";

const ProgressPage = () => {
  const [problems, setProblems] = useState([]);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const saveTimeout = useRef();

  // Load progress from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("leetcode-progress");
      if (stored) setProgress(JSON.parse(stored));
    }
  }, []);

  // Debounced save to localStorage
  const debouncedSave = (progressObj) => {
    if (typeof window !== "undefined") {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => {
        const saveFn = () => {
          try {
            localStorage.setItem("leetcode-progress", JSON.stringify(progressObj));
          } catch (e) {}
        };
        if (typeof window.requestIdleCallback === "function") {
          window.requestIdleCallback(saveFn, { timeout: 1000 });
        } else {
          setTimeout(saveFn, 0);
        }
      }, 0);
    }
  };

  // Fetch problems
  const fetchProblems = async () => {
    setLoading(true);
    setError(null);
    setTimeout(async () => {
      try {
        const response = await fetch("/api/problems", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        if (!data.success) throw new Error(data.message || "Failed to fetch problems");
        // Sort problems by serial number (numeric ascending)
        const sortedProblems = [...data.problems].sort((a, b) => {
          const aNum = Number(a.serial);
          const bNum = Number(b.serial);
          if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
          return String(a.serial).localeCompare(String(b.serial));
        });
        setProblems(sortedProblems);
        setLoading(false);
      } catch (error) {
        setError("Failed to fetch problems from database");
        setLoading(false);
      }
    }, 0);
  };

  useEffect(() => {
    fetchProblems();
  }, []);

  // Progress calculations
  const totalProblems = problems.length;
  const doneCount = problems.filter((p) => progress[p._id]?.done).length;
  const revisedCount = problems.filter((p) => progress[p._id]?.revised).length;
  const donePercent = totalProblems ? Math.round((doneCount / totalProblems) * 100) : 0;
  const revisedPercent = totalProblems ? Math.round((revisedCount / totalProblems) * 100) : 0;

  // Always sort problems before rendering, in case API or state changes
  const sortedProblems = [...problems].sort((a, b) => {
    const aNum = Number(a.serial);
    const bNum = Number(b.serial);
    if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
    return String(a.serial).localeCompare(String(b.serial));
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center px-4">
      <div className="max-w-xl w-full">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl shadow-lg">
            <Database className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Progress Overview
            </h1>
            <p className="text-cyan-400 text-sm font-bold animate-pulse">
              {totalProblems} problems loaded
            </p>
          </div>
        </div>
        {loading ? (
          <div className="py-20 text-center">
            <div className="relative mx-auto mb-8 w-20 h-20">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full animate-spin">
                <div className="absolute inset-2 bg-slate-950 rounded-full" />
              </div>
              <Database className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-cyan-400 animate-pulse" />
            </div>
            <p className="text-xl text-white font-bold mb-2">Connecting to Server...</p>
            <p className="text-slate-400">Fetching problems from Leetcode</p>
          </div>
        ) : error ? (
          <div className="bg-gradient-to-r from-red-900/20 to-red-800/20 backdrop-blur-xl border border-red-500/30 p-8 rounded-2xl text-center">
            <Database className="mx-auto mb-4 text-red-400" size={64} />
            <p className="text-xl font-bold text-red-300 mb-2">{error}</p>
            <p className="text-slate-400 mb-6">Please check your internet connection and try again or contact admin!!</p>
            <button
              onClick={fetchProblems}
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-bold transition-all duration-300 hover:shadow-lg hover:shadow-red-500/25"
            >
              Retry Connection
            </button>
          </div>
        ) : (
          <>
            {/* Progress Bars */}
            {totalProblems > 0 && (
              <div className="mb-8 w-full">
                {/* Done Progress Bar */}
                <div className="mb-2">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-bold text-green-400">Done: {doneCount}/{totalProblems}</span>
                    <span className="text-xs text-green-400">{donePercent}%</span>
                  </div>
                  <div className="relative h-4 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                    <div
                      className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-400 to-emerald-500"
                      style={{ width: `${donePercent}%`, transition: 'width 0.5s' }}
                    />
                  </div>
                </div>
                {/* Revised Progress Bar */}
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-bold text-cyan-400">Revised: {revisedCount}/{totalProblems}</span>
                    <span className="text-xs text-cyan-400">{revisedPercent}%</span>
                  </div>
                  <div className="relative h-4 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                    <div
                      className="absolute left-0 top-0 h-full bg-gradient-to-r from-cyan-400 to-blue-500"
                      style={{ width: `${revisedPercent}%`, transition: 'width 0.5s' }}
                    />
                  </div>
                </div>
              </div>
            )}
            <div
              className="flex flex-col gap-3 mt-8 overflow-y-auto"
              style={{ maxHeight: '70vh' }}
            >
              {sortedProblems.map((problem) => {
                const isDone = progress[problem._id]?.done || false;
                const isRevised = progress[problem._id]?.revised || false;
                return (
                  <div
                    key={problem._id}
                    className={`flex items-center gap-4 p-4 rounded-xl border shadow-lg transition-all duration-300 ${isDone ? 'bg-green-900/20 border-green-500/30' : 'bg-slate-800/60 border-slate-700/50'} ${isRevised ? 'ring-2 ring-cyan-400/40' : ''}`}
                  >
                    <div className="w-12 h-12 flex items-center justify-center rounded-lg font-bold text-lg text-white bg-gradient-to-br from-cyan-500 to-blue-600 shadow">
                      {problem.serial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-white text-base truncate">{problem.title}</div>
                      <div className="flex gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${problem.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : problem.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>{problem.difficulty}</span>
                      </div>
                      <div className="flex gap-2 mt-1 flex-wrap">
                        <a
                          href={problem.questionLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-0.5 bg-cyan-500/10 border border-cyan-400/30 rounded-full text-cyan-300 text-xs font-bold hover:bg-cyan-500/20 hover:text-white transition-colors duration-200 shadow min-w-max"
                        >
                          Problem
                        </a>
                        <a
                          href={problem.solutionLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-0.5 bg-purple-500/10 border border-purple-400/30 rounded-full text-purple-300 text-xs font-bold hover:bg-purple-500/20 hover:text-white transition-colors duration-200 shadow min-w-max"
                        >
                          Solution
                        </a>
                      </div>
                    </div>
                    {/* Progress checkboxes for progress page */}
                    <div className="flex flex-col gap-2 ml-4">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isDone}
                          onChange={() => {
                            const updated = { ...progress, [problem._id]: { ...progress[problem._id], done: !isDone } };
                            setProgress(updated);
                            debouncedSave(updated);
                          }}
                          className="custom-checkbox"
                        />
                        <span className="text-xs font-bold text-green-400">Done</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isRevised}
                          onChange={() => {
                            const updated = { ...progress, [problem._id]: { ...progress[problem._id], revised: !isRevised } };
                            setProgress(updated);
                            debouncedSave(updated);
                          }}
                          className="custom-checkbox"
                        />
                        <span className="text-xs font-bold text-cyan-400">Revised</span>
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProgressPage;
