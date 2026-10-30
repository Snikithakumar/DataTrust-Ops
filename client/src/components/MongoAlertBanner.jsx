import React from 'react';
import { Database, AlertCircle, ExternalLink, Copy, Check } from 'lucide-react';
import Modal from './UI/Modal';
import Button from './UI/Button';

export default function MongoAlertBanner({ isConnected, isModalOpen, setIsModalOpen }) {
  const [copied, setCopied] = React.useState(false);

  const envSnippet = `MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/datatrustops?retryWrites=true&w=majority`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(envSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* Top Banner when offline */}
      {!isConnected && (
        <div className="bg-[#FDF8F3] border-b border-[#B77936]/30 px-4 py-2.5 text-xs text-[#253248]">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#B77936] shrink-0" />
              <span>
                <strong>Persistence Notice:</strong> MongoDB is disconnected. DataTrust Ops is safely running in simulated in-memory mode.
              </span>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-[#167D80] hover:text-[#12676A] underline font-semibold flex items-center gap-1 transition"
            >
              Configure MongoDB Atlas Guide <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Atlas Setup Guide Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="MongoDB Atlas Configuration Guide"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4 text-xs text-[#253248]">
          <div className="p-3 bg-[#FBF9F5] border border-[#D8D2C7] rounded-lg">
            <p className="text-[#667085] leading-relaxed">
              DataTrust Ops strictly respects data persistence. When MongoDB is not detected locally, updates remain in an in-memory session. Follow these 4 steps to persist your pipelines, scans, and incidents to a free MongoDB Atlas cluster.
            </p>
          </div>

          <ol className="space-y-3 list-decimal list-inside text-[#253248]">
            <li className="p-3 bg-[#FBF9F5] rounded-lg border border-[#D8D2C7]">
              <span className="font-semibold text-[#17263F]">Create Free Atlas Cluster:</span>
              <p className="text-[#667085] mt-1 pl-4">
                Visit <a href="https://www.mongodb.com/cloud/atlas" target="_blank" rel="noreferrer" className="text-[#167D80] underline font-medium">cloud.mongodb.com</a> and create a free Shared Cluster (M0).
              </p>
            </li>

            <li className="p-3 bg-[#FBF9F5] rounded-lg border border-[#D8D2C7]">
              <span className="font-semibold text-[#17263F]">Database User & IP Access:</span>
              <p className="text-[#667085] mt-1 pl-4">
                In Atlas, under <em>Security &gt; Database Access</em> create a user (e.g., <code className="bg-[#E9E5DC] px-1.5 py-0.5 rounded text-[#17263F] font-mono">datatrust_user</code>). Under <em>Network Access</em> allow IP <code className="bg-[#E9E5DC] px-1.5 py-0.5 rounded text-[#17263F] font-mono">0.0.0.0/0</code> for development.
              </p>
            </li>

            <li className="p-3 bg-[#FBF9F5] rounded-lg border border-[#D8D2C7]">
              <span className="font-semibold text-[#17263F]">Add URI to server/.env:</span>
              <div className="mt-1.5 pl-4">
                <div className="flex items-center justify-between bg-[#E9E5DC] border border-[#D8D2C7] p-2.5 rounded text-xs font-mono text-[#17263F] overflow-x-auto">
                  <code>{envSnippet}</code>
                  <button
                    onClick={copyToClipboard}
                    className="ml-2 p-1 text-[#667085] hover:text-[#17263F] transition"
                    title="Copy connection string template"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-[#167D80]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </li>

            <li className="p-3 bg-[#FBF9F5] rounded-lg border border-[#D8D2C7]">
              <span className="font-semibold text-[#17263F]">Restart & Seed Data:</span>
              <p className="text-[#667085] mt-1 pl-4">
                Run <code className="bg-[#E9E5DC] px-1.5 py-0.5 rounded text-[#17263F] font-mono">npm --prefix server run seed</code> to populate the sample pipelines and incidents into MongoDB.
              </p>
            </li>
          </ol>

          <div className="flex justify-end pt-2">
            <Button variant="primary" onClick={() => setIsModalOpen(false)}>
              Understood
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
