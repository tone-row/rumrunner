import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useParams,
  useNavigate,
} from "react-router-dom";

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

// Sidebar Component
function Sidebar({
  functions,
  jobGroups,
}: {
  functions: Function[];
  jobGroups: JobGroup[];
}) {
  const navigate = useNavigate();
  const location = window.location.pathname;
  const selectedFunction = location.startsWith("/function/")
    ? decodeURIComponent(location.replace("/function/", ""))
    : undefined;

  const getJobCount = (functionName: string) => {
    const group = jobGroups.find((g) => g.functionName === functionName);
    return group ? group.jobs.length : 0;
  };

  const getStatusSummary = (functionName: string) => {
    const group = jobGroups.find((g) => g.functionName === functionName);
    if (!group) return { pending: 0, complete: 0, error: 0 };

    return group.jobs.reduce(
      (acc, job) => {
        acc[job.status as keyof typeof acc]++;
        return acc;
      },
      { pending: 0, complete: 0, error: 0 }
    );
  };

  return (
    <div className="w-80 bg-white shadow-lg h-screen overflow-y-auto">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Functions</h2>
        <p className="text-sm text-gray-600">
          Select a function to view its jobs
        </p>
      </div>

      <div className="p-4 border-b border-gray-200">
        <Link
          to="/"
          className={`block p-3 rounded-lg border transition-all ${
            location === "/"
              ? "bg-blue-50 border-blue-200 text-blue-700"
              : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
          }`}
        >
          <div className="flex items-center">
            <span className="text-lg mr-2">🏠</span>
            <span className="font-medium">Dashboard</span>
          </div>
        </Link>
      </div>

      <div className="p-4">
        {functions.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-2">🔧</div>
            <p className="text-gray-500 text-sm">No functions registered</p>
          </div>
        ) : (
          <div className="space-y-2">
            {functions.map((func) => {
              const jobCount = getJobCount(func.name);
              const statusSummary = getStatusSummary(func.name);
              const isSelected = selectedFunction === func.name;

              return (
                <Link
                  key={func.name}
                  to={`/function/${encodeURIComponent(func.name)}`}
                  className={`block p-4 rounded-lg border transition-all ${
                    isSelected
                      ? "bg-blue-50 border-blue-200 text-blue-700"
                      : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm truncate">
                      {func.name}
                    </h3>
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                      {jobCount}
                    </span>
                  </div>

                  {jobCount > 0 && (
                    <div className="flex space-x-1 text-xs">
                      {statusSummary.pending > 0 && (
                        <span className="bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">
                          {statusSummary.pending} pending
                        </span>
                      )}
                      {statusSummary.complete > 0 && (
                        <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                          {statusSummary.complete} complete
                        </span>
                      )}
                      {statusSummary.error > 0 && (
                        <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                          {statusSummary.error} error
                        </span>
                      )}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Function Detail Component
function FunctionDetail({
  functions,
  jobGroups,
}: {
  functions: Function[];
  jobGroups: JobGroup[];
}) {
  const { functionName } = useParams<{ functionName: string }>();
  const navigate = useNavigate();

  const decodedFunctionName = functionName
    ? decodeURIComponent(functionName)
    : "";
  const functionData = functions.find((f) => f.name === decodedFunctionName);
  const jobGroup = jobGroups.find(
    (g) => g.functionName === decodedFunctionName
  );

  const runJobs = async (functionName: string) => {
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
    } catch (error) {
      console.error("Failed to run jobs:", error);
      alert(`Failed to run jobs: ${error}`);
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

  if (!functionData) {
    return (
      <div className="flex-1 p-8">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">❓</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Function Not Found
          </h3>
          <p className="text-gray-500 mb-4">
            The function "{decodedFunctionName}" was not found.
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {functionData.name}
            </h1>
            {functionData.description && (
              <p className="text-gray-600">{functionData.description}</p>
            )}
          </div>

          {jobGroup && jobGroup.jobs.length > 0 && (
            <div className="flex space-x-3">
              <button
                onClick={() => runJobs(decodedFunctionName)}
                disabled={jobGroup.isRunning}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  jobGroup.isRunning
                    ? "bg-blue-300 text-white cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800"
                }`}
              >
                {jobGroup.isRunning ? (
                  <span className="flex items-center">
                    <span className="animate-spin mr-2">⟳</span>
                    Running...
                  </span>
                ) : (
                  <span className="flex items-center">▶ Run All Jobs</span>
                )}
              </button>
              <button
                onClick={async () => {
                  if (
                    !confirm(
                      `Are you sure you want to delete all jobs for ${decodedFunctionName}?`
                    )
                  ) {
                    return;
                  }
                  try {
                    const response = await fetch("/api/jobs", {
                      method: "DELETE",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        functionName: decodedFunctionName,
                      }),
                    });
                    if (!response.ok) {
                      throw new Error("Failed to delete all jobs");
                    }
                    window.location.reload();
                  } catch (error) {
                    console.error("Failed to delete all jobs:", error);
                    alert("Failed to delete all jobs");
                  }
                }}
                className="px-6 py-3 rounded-lg font-medium bg-red-600 text-white hover:bg-red-700 active:bg-red-800 transition-all"
              >
                🗑️ Clear All Jobs
              </button>
            </div>
          )}
        </div>

        {jobGroup ? (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    Jobs ({jobGroup.jobs.length})
                  </h3>
                  <p className="text-blue-100 text-sm">
                    {jobGroup.jobs.filter((j) => j.status === "pending").length}{" "}
                    pending,{" "}
                    {
                      jobGroup.jobs.filter((j) => j.status === "complete")
                        .length
                    }{" "}
                    complete,{" "}
                    {jobGroup.jobs.filter((j) => j.status === "error").length}{" "}
                    error
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {jobGroup.jobs.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-4">📋</div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    No Jobs for This Function
                  </h3>
                  <p className="text-gray-500">
                    Queue some jobs using the queue() method to see them here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {jobGroup.jobs.map((job) => (
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

                      <div className="flex space-x-2 mt-3 pt-3 border-t border-gray-200">
                        {job.status === "pending" && (
                          <button
                            onClick={async () => {
                              try {
                                const response = await fetch(
                                  `/api/jobs/${job.id}/run`,
                                  {
                                    method: "POST",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                  }
                                );
                                if (!response.ok) {
                                  throw new Error("Failed to run job");
                                }
                                // Refresh the page data
                                window.location.reload();
                              } catch (error) {
                                console.error("Failed to run job:", error);
                                alert("Failed to run job");
                              }
                            }}
                            className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                          >
                            ▶ Run
                          </button>
                        )}
                        <button
                          onClick={async () => {
                            try {
                              const response = await fetch(
                                `/api/jobs/requeue`,
                                {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({
                                    functionName: decodedFunctionName,
                                    args: job.args,
                                  }),
                                }
                              );
                              if (!response.ok) {
                                throw new Error("Failed to requeue job");
                              }
                              // Refresh the page data
                              window.location.reload();
                            } catch (error) {
                              console.error("Failed to requeue job:", error);
                              alert("Failed to requeue job");
                            }
                          }}
                          className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          🔄 Requeue
                        </button>
                        <button
                          onClick={async () => {
                            if (
                              !confirm(
                                "Are you sure you want to delete this job?"
                              )
                            ) {
                              return;
                            }
                            try {
                              const response = await fetch(
                                `/api/jobs/${job.id}`,
                                {
                                  method: "DELETE",
                                }
                              );
                              if (!response.ok) {
                                throw new Error("Failed to delete job");
                              }
                              // Refresh the page data
                              window.location.reload();
                            } catch (error) {
                              console.error("Failed to delete job:", error);
                              alert("Failed to delete job");
                            }
                          }}
                          className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="text-gray-400 text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No Jobs Found
            </h3>
            <p className="text-gray-500">
              This function has no queued jobs yet. Queue some jobs to see them
              here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Home Component
function Home({
  functions,
  jobGroups,
}: {
  functions: Function[];
  jobGroups: JobGroup[];
}) {
  const totalJobs = jobGroups.reduce(
    (sum, group) => sum + group.jobs.length,
    0
  );
  const pendingJobs = jobGroups.reduce(
    (sum, group) =>
      sum + group.jobs.filter((j) => j.status === "pending").length,
    0
  );
  const completeJobs = jobGroups.reduce(
    (sum, group) =>
      sum + group.jobs.filter((j) => j.status === "complete").length,
    0
  );
  const errorJobs = jobGroups.reduce(
    (sum, group) => sum + group.jobs.filter((j) => j.status === "error").length,
    0
  );

  return (
    <div className="flex-1 p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Rumrunner Dashboard
        </h1>
        <p className="text-gray-600">
          Welcome to your function evaluation dashboard
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <span className="text-2xl">🔧</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Functions</p>
              <p className="text-2xl font-bold text-gray-900">
                {functions.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <span className="text-2xl">⏳</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Jobs</p>
              <p className="text-2xl font-bold text-gray-900">{pendingJobs}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <span className="text-2xl">✓</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Complete Jobs</p>
              <p className="text-2xl font-bold text-gray-900">{completeJobs}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 text-red-600">
              <span className="text-2xl">✗</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Error Jobs</p>
              <p className="text-2xl font-bold text-gray-900">{errorJobs}</p>
            </div>
          </div>
        </div>
      </div>

      {functions.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-gray-400 text-6xl mb-4">🔧</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No Functions Registered
          </h3>
          <p className="text-gray-500">
            Register some functions to see them here. Functions will appear when
            you use the registerFunction() method.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Recent Functions
          </h2>
          <div className="space-y-3">
            {functions.slice(0, 5).map((func) => {
              const group = jobGroups.find((g) => g.functionName === func.name);
              const jobCount = group ? group.jobs.length : 0;

              return (
                <Link
                  key={func.name}
                  to={`/function/${encodeURIComponent(func.name)}`}
                  className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <h3 className="font-medium text-gray-900">{func.name}</h3>
                    {func.description && (
                      <p className="text-sm text-gray-500">
                        {func.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">
                      {jobCount} jobs
                    </span>
                    <span className="text-gray-400">→</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Main App Component
function AppContent() {
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

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 font-sans min-h-[100dvh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Rumrunner...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 font-sans min-h-[100dvh]">
      <div className="flex h-screen">
        <Sidebar functions={functions} jobGroups={jobGroups} />
        <div className="flex-1 overflow-y-auto">
          <Routes>
            <Route
              path="/"
              element={<Home functions={functions} jobGroups={jobGroups} />}
            />
            <Route
              path="/function/:functionName"
              element={
                <FunctionDetail functions={functions} jobGroups={jobGroups} />
              }
            />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export function DevUI() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
