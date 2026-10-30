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
        <div className="bg-amber-950/40 border-b border-amber-500/30 px-4 py-2 text-xs text-amber-200">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Persistence Notice:</strong> MongoDB is disconnected. DataTrust Ops is safely running in simulated in-memory mode.
              </span>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-amber-300 hover:text-white underline font-semibold flex items-center gap-1 transition"
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
        <div className="space-y-4 text-sm text-slate-300">
          <div className="p-3 bg-navy-950 border border-slate-800 rounded-lg">
            <p className="text-xs text-slate-400 leading-relaxed">
              DataTrust Ops strictly respects data persistence. When MongoDB is not detected locally, updates remain in an in-memory session. Follow these 4 steps to persist your pipelines, scans, and incidents to a free MongoDB Atlas cluster.
            </p>
          </div>

          <ol className="space-y-3 list-decimal list-inside text-slate-200">
            <li className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-800">
              <span className="font-semibold text-teal-300">Create Free Atlas Cluster:</span>
              <p className="text-xs text-slate-400 mt-1 pl-4">
                Visit <a href="https://www.mongodb.com/cloud/atlas" target="_blank" rel="noreferrer" className="text-teal-400 underline">cloud.mongodb.com</a> and create a free Shared Cluster (M0).
              </p>
            </li>

            <li className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-800">
              <span className="font-semibold text-teal-300">Database User & IP Access:</span>
              <p className="text-xs text-slate-400 mt-1 pl-4">
                In Atlas, under <em>Security &gt; Database Access</em> create a user (e.g., <code className="bg-slate-950 px-1 py-0.5 rounded text-amber-300 font-mono">datatrust_user</code>). Under <em>Network Access</em> allow IP <code className="bg-slate-950 px-1 py-0.5 rounded text-amber-300 font-mono">0.0.0.0/0</code> for development.
              </p>
            </li>

            <li className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-800">
              <span className="font-semibold text-teal-300">Add URI to server/.env:</span>
              <div className="mt-1 pl-4">
                <div className="flex items-center justify-between bg-navy-950 border border-slate-800 p-2 rounded text-xs font-mono text-teal-300 overflow-x-auto">
                  <code>{envSnippet}</code>
                  <button
                    onClick={copyToClipboard}
                    className="ml-2 p-1 text-slate-400 hover:text-white transition"
                    title="Copy connection string template"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-teal-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </li>

            <li className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-800">
              <span className="font-semibold text-teal-300">Restart & Seed Data:</span>
              <p className="text-xs text-slate-400 mt-1 pl-4">
                Run <code className="bg-navy-950 px-1.5 py-0.5 rounded text-teal-300 font-mono">npm --prefix server run seed</code> to populate the sample pipelines and incidents into MongoDB.
              </p>
            </li>
          </ol>

          <div className="flex justify-end pt-2">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Got It
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
