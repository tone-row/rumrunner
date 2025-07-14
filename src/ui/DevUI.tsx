import React, { useEffect, useState } from "react";

interface Job {
  id: number;
  cache_key: string;
  args_key: string;
  args: any[];
  status: "pending" | "complete" | "error";
  result?: any;
  error?: string;
  created_at: number;
  updated_at: number;
}

interface Function {
  name: string;
  description?: string;
  params?: Record<string, any>;
  version?: string;
}

interface JobGroup {
  functionName: string;
  jobs: Job[];
  isRunning: boolean;
}

export function DevUI() {
  const [functions, setFunctions] = useState<Function[]>([]);
  const [jobGroups, setJobGroups] = useState<JobGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [functionsRes, jobsRes] = await Promise.all([
        fetch("/api/functions"),
        fetch("/api/jobs"),
      ]);

      const functionsData = await functionsRes.json();
      const jobsData = await jobsRes.json();

      setFunctions(functionsData.functions || []);

      // Group jobs by function
      const jobs = jobsData.jobs || [];
      const groupedJobs: Record<string, Job[]> = {};

      jobs.forEach((job: Job) => {
        const functionName = job.cache_key.split(":")[0];
        if (!groupedJobs[functionName]) {
          groupedJobs[functionName] = [];
        }
        groupedJobs[functionName].push(job);
      });

      const groups: JobGroup[] = Object.entries(groupedJobs).map(
        ([functionName, jobs]) => ({
          functionName,
          jobs,
          isRunning: false,
        })
      );

      setJobGroups(groups);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Poll for updates every 2 seconds
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  const runJobs = async (functionName: string) => {
    // Update UI to show running state
    setJobGroups((prev) =>
      prev.map((group) =>
        group.functionName === functionName
          ? { ...group, isRunning: true }
          : group
      )
    );

    try {
      const response = await fetch("/api/jobs/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ functionName }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to run jobs");
      }

      // Refresh data after running
      await fetchData();
    } catch (error) {
      console.error("Failed to run jobs:", error);
      alert(`Failed to run jobs: ${error}`);
    } finally {
      // Clear running state
      setJobGroups((prev) =>
        prev.map((group) =>
          group.functionName === functionName
            ? { ...group, isRunning: false }
            : group
        )
      );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "complete":
        return "bg-green-100 text-green-800 border-green-200";
      case "error":
        return "bg-red-100 text-red-800 border-red-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "complete":
        return "✓";
      case "error":
        return "✗";
      case "pending":
        return "⏳";
      default:
        return "?";
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 font-sans p-6 min-h-[100dvh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Rumrunner...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 font-sans p-6 min-h-[100dvh]">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 tracking-tight mb-2">
            Rumrunner Job Manager
          </h1>
          <p className="text-gray-600">
            Manage and run your queued function evaluations
          </p>
        </div>

        {jobGroups.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="text-gray-400 text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No Jobs Found
            </h3>
            <p className="text-gray-500">
              Queue some jobs to see them here. Jobs will appear when you use
              the queue() method.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {jobGroups.map((group) => (
              <div
                key={group.functionName}
                className="bg-white rounded-xl shadow-lg overflow-hidden"
              >
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-white">
                        {group.functionName}
                      </h3>
                      <p className="text-blue-100 text-sm">
                        {group.jobs.length} job
                        {group.jobs.length !== 1 ? "s" : ""} queued
                      </p>
                    </div>
                    <button
                      onClick={() => runJobs(group.functionName)}
                      disabled={group.isRunning}
                      className={`px-6 py-2 rounded-lg font-medium transition-all ${
                        group.isRunning
                          ? "bg-blue-300 text-white cursor-not-allowed"
                          : "bg-white text-blue-600 hover:bg-blue-50 active:bg-blue-100"
                      }`}
                    >
                      {group.isRunning ? (
                        <span className="flex items-center">
                          <span className="animate-spin mr-2">⟳</span>
                          Running...
                        </span>
                      ) : (
                        <span className="flex items-center">▶ Run Jobs</span>
                      )}
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <div className="space-y-3">
                    {group.jobs.map((job) => (
                      <div
                        key={job.id}
                        className="border rounded-lg p-4 bg-gray-50"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                                job.status
                              )}`}
                            >
                              <span className="mr-1">
                                {getStatusIcon(job.status)}
                              </span>
                              {job.status}
                            </span>
                            <span className="text-sm text-gray-500">
                              Job #{job.id}
                            </span>
                          </div>
                          <span className="text-xs text-gray-400">
                            {formatDate(job.created_at)}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <div>
                            <span className="text-sm font-medium text-gray-700">
                              Arguments:
                            </span>
                            <pre className="text-xs bg-white p-2 rounded border mt-1 overflow-x-auto">
                              {JSON.stringify(job.args, null, 2)}
                            </pre>
                          </div>

                          {job.result && (
                            <div>
                              <span className="text-sm font-medium text-gray-700">
                                Result:
                              </span>
                              <pre className="text-xs bg-white p-2 rounded border mt-1 overflow-x-auto">
                                {JSON.stringify(job.result, null, 2)}
                              </pre>
                            </div>
                          )}

                          {job.error && (
                            <div>
                              <span className="text-sm font-medium text-red-700">
                                Error:
                              </span>
                              <pre className="text-xs bg-red-50 p-2 rounded border mt-1 overflow-x-auto text-red-700">
                                {job.error}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <footer className="mt-12 text-center text-sm text-gray-400">
          <p>Rumrunner Job Manager &copy; {new Date().getFullYear()}</p>
          <p className="mt-1">Auto-refreshing every 2 seconds</p>
        </footer>
      </div>
    </div>
  );
}
