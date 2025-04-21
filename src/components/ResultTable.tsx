
import React from "react";
import { Image as ImageIcon, Check, X, Loader } from "lucide-react";

type Result = {
  fileId: string;
  fileName: string;
  fileDataUrl: string | null;
  metadata: {
    subject: string;
    creator: string;
    date_created: string;
    location: string;
    event: string;
    category: string;
    description: string;
  } | null;
  status: "analyzing" | "done" | "failed";
};

type Props = {
  results: Result[];
  isLoading: boolean;
};

const ResultTable: React.FC<Props> = ({ results }) => {
  if (!results.length) return null;

  return (
    <div className="w-full max-w-6xl mx-auto overflow-x-auto pb-2">
      <table className="w-full min-w-[900px] border-collapse rounded-xl bg-[#29282B] shadow">
        <thead>
          <tr className="bg-[#222222] text-gray-400">
            <th className="px-3 py-2 text-xs font-bold uppercase border-b border-[#403E43]">Img</th>
            <th className="px-3 py-2 text-xs font-bold uppercase border-b border-[#403E43]">File Name</th>
            <th className="px-3 py-2 text-xs font-bold uppercase border-b border-[#403E43]">Subject</th>
            <th className="px-3 py-2 text-xs font-bold uppercase border-b border-[#403E43]">Creator</th>
            <th className="px-3 py-2 text-xs font-bold uppercase border-b border-[#403E43]">Date Created</th>
            <th className="px-3 py-2 text-xs font-bold uppercase border-b border-[#403E43]">Location</th>
            <th className="px-3 py-2 text-xs font-bold uppercase border-b border-[#403E43]">Event</th>
            <th className="px-3 py-2 text-xs font-bold uppercase border-b border-[#403E43]">Category</th>
            <th className="px-3 py-2 text-xs font-bold uppercase border-b border-[#403E43]">Description</th>
            <th className="px-3 py-2 text-xs font-bold uppercase border-b border-[#403E43]">Status</th>
          </tr>
        </thead>
        <tbody>
          {results.map(({ fileId, fileName, fileDataUrl, metadata, status }, idx) => (
            <tr key={fileId} className={idx % 2 === 0 ? "bg-[#232326]" : "bg-[#29282B]"}>
              <td className="px-2 py-2 text-center border-b border-[#403E43]">
                {fileDataUrl ? (
                  <img src={fileDataUrl} alt="thumbnail" className="w-12 h-12 object-cover rounded shadow border border-[#403E43] mx-auto" />
                ) : (
                  <ImageIcon className="w-7 h-7 text-gray-600 mx-auto" />
                )}
              </td>
              <td className="px-2 py-2 text-sm text-gray-200 font-mono border-b border-[#403E43]">{fileName}</td>
              {metadata ? (
                <>
                  <td className="px-2 py-2 text-sm text-gray-100 border-b border-[#403E43]">{metadata.subject}</td>
                  <td className="px-2 py-2 text-sm text-gray-100 border-b border-[#403E43]">{metadata.creator}</td>
                  <td className="px-2 py-2 text-sm text-gray-100 border-b border-[#403E43]">{metadata.date_created}</td>
                  <td className="px-2 py-2 text-sm text-gray-100 border-b border-[#403E43]">{metadata.location}</td>
                  <td className="px-2 py-2 text-sm text-gray-100 border-b border-[#403E43]">{metadata.event}</td>
                  <td className="px-2 py-2 text-sm text-gray-100 border-b border-[#403E43]">{metadata.category}</td>
                  <td className="px-2 py-2 text-sm text-gray-100 border-b border-[#403E43]">{metadata.description}</td>
                  <td className="px-2 py-2 text-xs font-semibold border-b border-[#403E43]">
                    <span className="flex items-center gap-1 text-green-500">
                      <Check className="w-4 h-4" /> Analyzed
                    </span>
                  </td>
                </>
              ) : status === "analyzing" ? (
                <>
                  <td colSpan={7} className="px-2 py-2 text-center text-sm text-gray-400 border-b border-[#403E43]">Analyzing...</td>
                  <td className="px-2 py-2 text-xs font-semibold text-blue-400 flex items-center justify-center gap-1 border-b border-[#403E43]">
                    <Loader className="w-4 h-4 animate-spin" /> Analyzing
                  </td>
                </>
              ) : (
                <>
                  <td colSpan={7} className="px-2 py-2 text-center text-sm text-gray-600 border-b border-[#403E43]">Failed</td>
                  <td className="px-2 py-2 text-xs font-semibold text-red-500 flex items-center justify-center gap-1 border-b border-[#403E43]">
                    <X className="w-4 h-4" /> Failed
                  </td>
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
