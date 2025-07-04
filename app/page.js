"use client";

import React, { useState, useEffect } from "react";
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
  const [viewMode, setViewMode] = useState("grid");
  const [filteredProblems, setFilteredProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ total: 0, easy: 0, medium: 0, hard: 0 });
  const [topics, setTopics] = useState([]);

  // Fetch problems from MongoDB via API
  const fetchProblemsFromMongo = async () => {
    try {
      setLoading(true);
      setError(null);

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

      // Extract unique topics
      const uniqueTopics = [...new Set(data.problems.map((p) => p.topic))];
      setTopics(uniqueTopics);

      // Calculate stats
      const newStats = {
        total: data.problems.length,
        easy: data.problems.filter((p) => p.difficulty === "Easy").length,
        medium: data.problems.filter((p) => p.difficulty === "Medium").length,
        hard: data.problems.filter((p) => p.difficulty === "Hard").length,
      };
      setStats(newStats);

      setLoading(false);
    } catch (error) {
      setError("Failed to fetch problems from database");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProblemsFromMongo();
  }, []);

  useEffect(() => {
    let filtered = problems.filter((problem) => {
      const matchesSearch =
        problem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        problem.serial.toString().includes(searchTerm) ||
        problem.topic.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDifficulty =
        filterDifficulty === "All" || problem.difficulty === filterDifficulty;
      const matchesTopic =
        filterTopic === "All" || problem.topic === filterTopic;
      return matchesSearch && matchesDifficulty && matchesTopic;
    });
    setFilteredProblems(filtered);
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

  const ProblemCard = ({ problem }) => (
    <div className="group relative bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 hover:from-slate-800/80 hover:to-slate-700/80 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-cyan-500/10 hover:border-cyan-500/30">
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/0 via-cyan-500/10 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                {problem.serial}
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors duration-300">
                {problem.title}
              </h3>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border shadow-lg ${getDifficultyColor(
                    problem.difficulty
                  )}`}
                >
                  {problem.difficulty}
                </span>
                <div className="flex items-center gap-1 px-2 py-1 bg-slate-800/50 rounded-lg border border-slate-600/30">
                  {getTopicIcon(problem.topic)}
                  <span className="text-xs text-slate-300 font-medium">
                    {problem.topic}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Video embed */}
        <div className="relative mb-6 rounded-xl overflow-hidden bg-black/50 border border-slate-700/50 group-hover:border-cyan-500/30 transition-colors duration-300">
          <div className="aspect-video relative">
            <iframe
              src={`https://www.youtube.com/embed/${getYouTubeVideoId(
                problem.solutionLink
              )}`}
              title={`Solution for ${problem.title}`}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
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
              Fetching problems from LeetcodeLinks cluster
            </p>
          </div>
        ) : error ? (
          <div className="bg-gradient-to-r from-red-900/20 to-red-800/20 backdrop-blur-xl border border-red-500/30 p-8 rounded-2xl text-center">
            <Database className="mx-auto mb-4 text-red-400" size={64} />
            <p className="text-xl font-bold text-red-300 mb-2">{error}</p>
            <p className="text-slate-400 mb-6">
              Please check your MongoDB connection and try again
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
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProblems.map((problem) => (
                  <ProblemCard key={problem._id} problem={problem} />
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {filteredProblems.map((problem) => (
                  <ProblemCard key={problem._id} problem={problem} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default LeetCodeShowcase;
