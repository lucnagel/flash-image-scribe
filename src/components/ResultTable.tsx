
import React from "react";

type Result = {
  fileId: string; // file name
  fileName: string;
  metadata: {
    subject: string;
    creator: string;
    date_created: string;
    location: string;
    event: string;
    category: string;
    description: string;
  } | null;
};

type Props = {
  results: Result[];
  isLoading: boolean;
};

const ResultTable: React.FC<Props> = ({ results, isLoading }) => {
  if (!results.length) return null;

  return (
    <div className="relative overflow-x-auto mt-8">
      <table className="w-full min-w-[640px] border-collapse rounded-lg bg-white">
        <thead>
          <tr className="bg-blue-50">
            <th className="px-3 py-2 text-xs font-bold uppercase border-b">File</th>
            <th className="px-3 py-2 text-xs font-bold uppercase border-b">Subject</th>
            <th className="px-3 py-2 text-xs font-bold uppercase border-b">Creator</th>
            <th className="px-3 py-2 text-xs font-bold uppercase border-b">Date Created</th>
            <th className="px-3 py-2 text-xs font-bold uppercase border-b">Location</th>
            <th className="px-3 py-2 text-xs font-bold uppercase border-b">Event</th>
            <th className="px-3 py-2 text-xs font-bold uppercase border-b">Category</th>
            <th className="px-3 py-2 text-xs font-bold uppercase border-b">Description</th>
            <th className="px-3 py-2 text-xs font-bold uppercase border-b">Status</th>
          </tr>
        </thead>
        <tbody>
          {results.map(({ fileId, fileName, metadata }, idx) => (
            <tr key={fileId} className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}>
              <td className="px-2 py-2 text-sm text-gray-700 font-mono">{fileName}</td>
              {metadata ? (
                <>
                  <td className="px-2 py-2 text-sm">{metadata.subject}</td>
                  <td className="px-2 py-2 text-sm">{metadata.creator}</td>
                  <td className="px-2 py-2 text-sm">{metadata.date_created}</td>
                  <td className="px-2 py-2 text-sm">{metadata.location}</td>
                  <td className="px-2 py-2 text-sm">{metadata.event}</td>
                  <td className="px-2 py-2 text-sm">{metadata.category}</td>
                  <td className="px-2 py-2 text-sm">{metadata.description}</td>
                  <td className="px-2 py-2 text-xs text-green-600 font-semibold">Analyzed</td>
                </>
              ) : (
                <>
                  <td colSpan={7} className="px-2 py-2 text-center text-sm text-gray-400">Pending / Failed</td>
                  <td className="px-2 py-2 text-xs text-orange-700 font-semibold">{isLoading ? "Analyzing..." : "Failed"}</td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ResultTable;
