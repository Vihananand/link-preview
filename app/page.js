"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  ExternalLink,
  Play,
  Filter,
  Grid,
  List,
  Code,
  Database,
  Zap,
  Terminal,
  ChevronDown,
  Cpu,
  Monitor,
} from "lucide-react";

const LeetCodeShowcase = () => {
  const [problems, setProblems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState("All");
  const [filterTopic, setFilterTopic] = useState("All");
  const [viewMode, setViewMode] = useState("list");
  const [filteredProblems, setFilteredProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ total: 0, easy: 0, medium: 0, hard: 0 });
  const [topics, setTopics] = useState([]);
  // Progress state: { [problemId]: { done: boolean, revised: boolean } }
  const [progress, setProgress] = useState({});
  // Infinite scroll logic (container-based, trackpad/mouse compatible)
  const CHUNK_SIZE = 20;
  const [visibleCount, setVisibleCount] = useState(CHUNK_SIZE);
  const listRef = useRef(null);

  useEffect(() => {
    setVisibleCount(CHUNK_SIZE); // Reset on filter change
  }, [filteredProblems]);

  // Throttle utility using requestAnimationFrame for smooth trackpad scroll
  function throttleRAF(fn) {
    let ticking = false;
    return (...args) => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          fn(...args);
          ticking = false;
        });
        ticking = true;
      }
    };
  }

  useEffect(() => {
    if (loading || error) return;
    const container = listRef.current;
    if (!container) return;
    const handleScroll = throttleRAF(() => {
      if (
        container.scrollTop + container.clientHeight >= container.scrollHeight - 600 &&
        visibleCount < filteredProblems.length
      ) {
        setVisibleCount((prev) => Math.min(prev + CHUNK_SIZE, filteredProblems.length));
      }
    });
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [loading, error, visibleCount, filteredProblems.length]);

  // Load progress from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("leetcode-progress");
      if (stored) {
        setProgress(JSON.parse(stored));
      }
    }
  }, []);


  // Debounced save to localStorage, using requestIdleCallback for smooth UI
  const saveTimeout = useRef();
  const debouncedSave = useRef((progressObj) => {
    if (typeof window !== "undefined") {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => {
        const saveFn = () => {
          try {
            localStorage.setItem("leetcode-progress", JSON.stringify(progressObj));
          } catch (e) {
            // Ignore quota errors
          }
        };
        if (typeof window.requestIdleCallback === "function") {
          window.requestIdleCallback(saveFn, { timeout: 1000 });
        } else {
          setTimeout(saveFn, 0);
        }
      }, 0);
    }
  });

  // Handler for checkbox changes
  const handleProgressChange = (problemId, type) => {
    setProgress((prev) => {
      const prevState = prev[problemId] || { done: false, revised: false };
      const newState = {
        ...prevState,
        [type]: !prevState[type],
      };
      const updated = { ...prev, [problemId]: newState };
      // Save to localStorage outside of React state update
      debouncedSave.current(updated);
      return updated;
    });
  };
  // Fetch problems from MongoDB via API
  const fetchProblemsFromMongo = async () => {
    setLoading(true);
    setError(null);
    // Defer fetch to next event loop so UI can update
    setTimeout(async () => {
      try {
        const response = await fetch("/api/problems", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.message || "Failed to fetch problems");
        }

        setProblems(data.problems);

        // Extract unique topics (flattened, no duplicates)
        setTimeout(() => {
          const allTopics = data.problems.flatMap((p) =>
            p.topic.split(',').map((t) => t.trim())
          );
          const uniqueTopics = [...new Set(allTopics)].filter(Boolean);
          setTopics(uniqueTopics);
        }, 0);

        // Calculate stats
        setTimeout(() => {
          const newStats = {
            total: data.problems.length,
            easy: data.problems.filter((p) => p.difficulty === "Easy").length,
            medium: data.problems.filter((p) => p.difficulty === "Medium").length,
            hard: data.problems.filter((p) => p.difficulty === "Hard").length,
          };
          setStats(newStats);
        }, 0);

        setLoading(false);
      } catch (error) {
        setError("Failed to fetch problems from database");
        setLoading(false);
      }
    }, 0);
  };

  useEffect(() => {
    fetchProblemsFromMongo();
  }, []);

  // Only update filteredProblems when search/filter or problems list changes, not on progress change
  useEffect(() => {
    let filtered = problems.filter((problem) => {
      const matchesSearch =
        problem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        problem.serial.toString().includes(searchTerm) ||
        problem.topic.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDifficulty =
        filterDifficulty === "All" || problem.difficulty === filterDifficulty;
      const matchesTopic =
        filterTopic === "All" ||
        problem.topic.split(',').map(t => t.trim()).includes(filterTopic);
      return matchesSearch && matchesDifficulty && matchesTopic;
    });
    // Sort filtered problems by serial number (numeric ascending)
    const sorted = [...filtered].sort((a, b) => {
      const aNum = Number(a.serial);
      const bNum = Number(b.serial);
      if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
      return String(a.serial).localeCompare(String(b.serial));
    });
    setFilteredProblems(sorted);
  }, [searchTerm, filterDifficulty, filterTopic, problems]);

  const getYouTubeVideoId = (url) => {
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "Easy":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-emerald-500/20";
      case "Medium":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-amber-500/20";
      case "Hard":
        return "bg-red-500/10 text-red-400 border-red-500/30 shadow-red-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/30 shadow-slate-500/20";
    }
  };

  const getTopicIcon = (topic) => {
    switch (topic.toLowerCase()) {
      case "array":
        return <Monitor size={16} className="text-cyan-400" />;
      case "string":
        return <Terminal size={16} className="text-purple-400" />;
      case "linked list":
        return <Zap size={16} className="text-yellow-400" />;
      case "stack":
        return <Cpu size={16} className="text-green-400" />;
      default:
        return <Code size={16} className="text-blue-400" />;
    }
  };

  // Memoize ProblemCard to prevent unnecessary rerenders unless progress for that problem changes

  const ProblemCard = React.memo(
    function ProblemCard({ problem, progress, onProgressChange }) {
      return (
        <div className="group relative bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-0 flex flex-col hover:from-slate-800/80 hover:to-slate-700/80 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-cyan-500/10 hover:border-cyan-500/30">
          {/* Video at top */}
          <div className="relative rounded-t-2xl overflow-hidden bg-black/50 border-b border-slate-700/50 group-hover:border-cyan-500/30 transition-colors duration-300">
            <div className="aspect-video relative">
              <iframe
                src={`https://www.youtube.com/embed/${getYouTubeVideoId(problem.solutionLink)}`}
                title={`Solution for ${problem.title}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          </div>
          {/* Card content below video */}
          <div className="relative z-10 flex-1 flex flex-col p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  {problem.serial}
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse" />
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors duration-300">
                {problem.title}
              </h3>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <span className={`px-3 py-1 rounded-full text-xs font-bold border shadow-lg ${getDifficultyColor(problem.difficulty)}`}>{problem.difficulty}</span>
              <div className="flex flex-wrap gap-1">
                {problem.topic.split(',').map((topic, idx) => (
                  <div key={idx} className="flex items-center gap-1 px-2 py-1 bg-slate-800/50 rounded-lg border border-slate-600/30">
                    {getTopicIcon(topic.trim())}
                    <span className="text-xs text-slate-300 font-medium">{topic.trim()}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Action buttons */}
            <div className="flex gap-3 mt-auto">
              <a
                href={problem.questionLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-4 py-3 rounded-xl font-bold text-center transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/25 hover:scale-[1.02] group/btn"
              >
                <ExternalLink
                  size={16}
                  className="inline-block mr-2 group-hover/btn:animate-pulse"
                />
                Problem
              </a>
              <a
                href={problem.solutionLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white px-4 py-3 rounded-xl font-bold text-center transition-all duration-300 hover:shadow-lg hover:shadow-pink-500/25 hover:scale-[1.02] group/btn"
              >
                <Play
                  size={16}
                  className="inline-block mr-2 group-hover/btn:animate-pulse"
                />
                Solution
              </a>
            </div>
          </div>
        </div>
      );
    },
    (prevProps, nextProps) => {
      // Only rerender if progress for this problem changes
      return (
        prevProps.problem._id === nextProps.problem._id &&
        prevProps.progress.done === nextProps.progress.done &&
        prevProps.progress.revised === nextProps.progress.revised &&
        prevProps.problem.serial === nextProps.problem.serial &&
        prevProps.problem.title === nextProps.problem.title &&
        prevProps.problem.difficulty === nextProps.problem.difficulty &&
        prevProps.problem.topic === nextProps.problem.topic &&
        prevProps.problem.questionLink === nextProps.problem.questionLink &&
        prevProps.problem.solutionLink === nextProps.problem.solutionLink
      );
    }
  );
  ProblemCard.displayName = "ProblemCard";



  // Popup state for blocking UI after videos load
  // Declare these at the top level of the component if not already present
  const [showBlockPopup, setShowBlockPopup] = useState(false);
  const [blockActive, setBlockActive] = useState(false);

  // Show blocking popup for 4 seconds, but render cards (and iframes) in the background
  // Only declare these once!
  // (If already declared above, do not redeclare here)
  useEffect(() => {
    if (!loading && !error && filteredProblems.length > 0) {
      setShowBlockPopup(true);
      setBlockActive(true);
      const timer = setTimeout(() => {
        setShowBlockPopup(false);
        setBlockActive(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [loading, error, filteredProblems.length]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Removed blocking popup overlay and pointer events logic */}
      {/* ...existing code... */}
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-2000" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-2xl border-b border-slate-800/50 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl shadow-lg">
                <Database className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-black bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                  LeetCode Hub
                </h1>
                <p className="text-cyan-400 text-sm font-bold animate-pulse [text-shadow:0_0_10px_#22d3ee,0_0_20px_#22d3ee]">
                  Made by Vihan Anand • {stats.total} problems loaded
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-3 py-1 bg-green-500/10 border border-green-500/30 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-green-400 text-xs font-bold">LIVE</span>
              </div>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-3 rounded-xl transition-all duration-300 ${viewMode === "grid"
                    ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg"
                    : "bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-white"
                  }`}
              >
                <Grid size={20} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-3 rounded-xl transition-all duration-300 ${viewMode === "list"
                    ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg"
                    : "bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-white"
                  }`}
              >
                <List size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="py-20 text-center">
            <div className="relative mx-auto mb-8 w-20 h-20">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full animate-spin">
                <div className="absolute inset-2 bg-slate-950 rounded-full" />
              </div>
              <Database className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-cyan-400 animate-pulse" />
            </div>
            <p className="text-xl text-white font-bold mb-2">
              Connecting to Server...
            </p>
            <p className="text-slate-400">
              Fetching important problems from Leetcode
            </p>
          </div>
        ) : error ? (
          <div className="bg-gradient-to-r from-red-900/20 to-red-800/20 backdrop-blur-xl border border-red-500/30 p-8 rounded-2xl text-center">
            <Database className="mx-auto mb-4 text-red-400" size={64} />
            <p className="text-xl font-bold text-red-300 mb-2">{error}</p>
            <p className="text-slate-400 mb-6">
              Please check your internet connection and try again or contact admin!!
            </p>
            <button
              onClick={fetchProblemsFromMongo}
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-bold transition-all duration-300 hover:shadow-lg hover:shadow-red-500/25"
            >
              Retry Connection
            </button>
          </div>
        ) : (
          <>
            {/* Search and Filter Controls */}
            <div className="flex flex-col lg:flex-row gap-4 mb-8">
              <div className="relative flex-1">
                <Search
                  className="absolute left-4 top-4 text-slate-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Search problems, topics, or serial numbers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500/50 focus:outline-none transition-all duration-300 hover:border-slate-600/50"
                />
              </div>

              <div className="flex gap-4">
                <div className="relative">
                  <Filter
                    className="absolute left-4 top-4 text-slate-400"
                    size={20}
                  />
                  <select
                    value={filterDifficulty}
                    onChange={(e) => setFilterDifficulty(e.target.value)}
                    className="pl-12 pr-10 py-4 bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl text-white appearance-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500/50 focus:outline-none transition-all duration-300 hover:border-slate-600/50 min-w-[150px]"
                  >
                    <option value="All">All Difficulties</option>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                  <ChevronDown
                    className="absolute right-4 top-4 text-slate-400"
                    size={20}
                  />
                </div>

                <div className="relative">
                  <Code
                    className="absolute left-4 top-4 text-slate-400"
                    size={20}
                  />
                  <select
                    value={filterTopic}
                    onChange={(e) => setFilterTopic(e.target.value)}
                    className="pl-12 pr-10 py-4 bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl text-white appearance-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500/50 focus:outline-none transition-all duration-300 hover:border-slate-600/50 min-w-[150px]"
                  >
                    <option value="All">All Topics</option>
                    {topics.map((topic) => (
                      <option key={topic} value={topic}>
                        {topic}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="absolute right-4 top-4 text-slate-400"
                    size={20}
                  />
                </div>
              </div>
            </div>


            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {[
                {
                  label: "Total",
                  count: filteredProblems.length,
                  color: "from-slate-600 to-slate-700",
                  icon: Database,
                },
                {
                  label: "Easy",
                  count: filteredProblems.filter(
                    (p) => p.difficulty === "Easy"
                  ).length,
                  color: "from-emerald-500 to-emerald-600",
                  icon: Monitor,
                },
                {
                  label: "Medium",
                  count: filteredProblems.filter(
                    (p) => p.difficulty === "Medium"
                  ).length,
                  color: "from-amber-500 to-amber-600",
                  icon: Zap,
                },
                {
                  label: "Hard",
                  count: filteredProblems.filter(
                    (p) => p.difficulty === "Hard"
                  ).length,
                  color: "from-red-500 to-red-600",
                  icon: Cpu,
                },
              ].map(({ label, count, color, icon: Icon }) => (
                <div key={label} className="group relative">
                  <div
                    className={`bg-gradient-to-r ${color} p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] border border-white/10`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-3xl font-black text-white mb-1">
                          {count}
                        </div>
                        <div className="text-white/80 text-sm font-bold">
                          {label}
                        </div>
                      </div>
                      <Icon className="text-white/60 group-hover:text-white transition-colors duration-300" size={24} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Progress bar moved to /progress page. */}
            <div className="mb-8 w-full flex justify-end">
              <a
                href="/progress"
                className="inline-block px-6 py-3 bg-gradient-to-r from-green-400 to-cyan-500 hover:from-green-500 hover:to-cyan-600 text-white rounded-xl font-bold transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/25 hover:scale-[1.02]"
              >
                View Progress
              </a>
            </div>

            {/* Problems Grid/List */}
            {filteredProblems.length === 0 ? (
              <div className="text-center py-20">
                <Code className="mx-auto mb-4 text-slate-600" size={64} />
                <p className="text-xl text-slate-400 mb-2">No problems found</p>
                <p className="text-slate-500">
                  Try adjusting your search criteria
                </p>
              </div>
            ) : viewMode === "grid" ? (
              <div
                ref={listRef}
                className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 overflow-y-auto overflow-x-hidden"
                style={{ maxHeight: '70vh', minWidth: '0', width: '100%' }}
              >
                {filteredProblems.slice(0, visibleCount).map((problem) => (
                  <ProblemCard
                    key={problem._id}
                    problem={problem}
                    progress={progress[problem._id] || { done: false, revised: false }}
                    onProgressChange={(type) => handleProgressChange(problem._id, type)}
                  />
                ))}
                {visibleCount < filteredProblems.length && (
                  <div className="col-span-full text-center py-6 text-slate-400 animate-pulse">Loading more...</div>
                )}
              </div>
            ) : (
              <div
                ref={listRef}
                className="flex flex-col gap-3 overflow-y-auto overflow-x-hidden"
                style={{ maxHeight: '70vh', minWidth: '0', width: '100%' }}
              >
                {filteredProblems.slice(0, visibleCount).map((problem) => (
                  <div
                    key={problem._id}
                    className="group flex flex-col md:flex-row bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-xl p-3 md:p-4 hover:from-slate-800/80 hover:to-slate-700/80 transition-all duration-500 hover:scale-[1.01] hover:shadow-xl hover:shadow-cyan-500/10 hover:border-cyan-500/30 min-w-0"
                  >
                    {/* Serial number */}
                    <div className="flex-shrink-0 w-16 h-12 md:w-24 md:h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-base md:text-lg shadow-lg mb-2 md:mb-0 md:mr-4">
                      {problem.serial}
                    </div>
                    {/* Main content */}
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      {/* Title always visible, truncated if needed */}
                      <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2 mb-1 min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <h3 className="text-base md:text-lg font-bold text-white group-hover:text-cyan-400 transition-colors duration-300 truncate min-w-0" style={{ maxWidth: '100%' }}>{problem.title}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold border shadow ${getDifficultyColor(problem.difficulty)}`} style={{ flex: 'none', whiteSpace: 'nowrap' }}>{problem.difficulty}</span>
                        </div>
                      </div>
                      {/* Tags: horizontal scroll on mobile, wrap on desktop */}
                      <div className="flex gap-1 overflow-x-auto md:flex-wrap md:overflow-x-visible pb-1 hide-scrollbar">
                        {problem.topic.split(',').map((topic, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-1 px-2 py-0.5 bg-slate-800/50 rounded border border-slate-600/30 flex-shrink-0 text-xs min-w-max"
                            style={{ marginLeft: 4, marginRight: 4 }}
                          >
                            {getTopicIcon(topic.trim())}
                            <span className="text-xs text-slate-300 font-medium">{topic.trim()}</span>
                          </div>
                        ))}
                      </div>
                      {/* Action buttons */}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
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
                  </div>
                ))}
                {visibleCount < filteredProblems.length && (
                  <div className="text-center py-6 text-slate-400 animate-pulse">Loading more...</div>
                )}
              </div>
            )}
          </>
        )}
        {/* Buy Me a Coffee / Support Link */}
        {!loading && (
          <div className="w-full flex justify-center mt-8 mb-6">
            <a
              href="/upi.png"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 text-lg"
            >
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white">
                <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
                <g id="SVGRepo_iconCarrier">
                  <g id="Environment / Coffee">
                    <path id="Vector" d="M4 20H10.9433M10.9433 20H11.0567M10.9433 20C10.9622 20.0002 10.9811 20.0002 11 20.0002C11.0189 20.0002 11.0378 20.0002 11.0567 20M10.9433 20C7.1034 19.9695 4 16.8468 4 12.9998V8.92285C4 8.41305 4.41305 8 4.92285 8H17.0767C17.5865 8 18 8.41305 18 8.92285V9M11.0567 20H18M11.0567 20C14.8966 19.9695 18 16.8468 18 12.9998M18 9H19.5C20.8807 9 22 10.1193 22 11.5C22 12.8807 20.8807 14 19.5 14H18V12.9998M18 9V12.9998M15 3L14 5M12 3L11 5M9 3L8 5" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                  </g>
                </g>
              </svg>
              Buy me a coffee
            </a>
          </div>
        )}
      </main>
    </div>
  );
};

export default LeetCodeShowcase;
