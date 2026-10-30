import React from 'react';
import {
  LayoutDashboard,
  Layers,
  FileSpreadsheet,
  ShieldAlert,
  Database,
  Info,
  BookOpen,
  X
} from 'lucide-react';
import Badge from './UI/Badge';

export default function Sidebar({
  activeTab,
  setActiveTab,
  health,
  unresolvedCount = 0,
  onOpenAtlasGuide,
  onOpenFormulaDoc,
  isOpen = false,
  onClose
}) {
  const dbConnected = health?.database?.connected;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pipelines', label: 'Pipelines', icon: Layers },
    { id: 'scanner', label: 'Quality Scanner', icon: FileSpreadsheet },
    { id: 'issues', label: 'Issues', icon: ShieldAlert, badge: unresolvedCount > 0 ? unresolvedCount : null }
  ];

  const handleNavClick = (id) => {
    setActiveTab(id);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#101B30]/70 backdrop-blur-xs md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 md:z-30 h-screen w-64 bg-[#17263F] border-r border-[#101B30] flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Branding Section */}
        <div className="p-5 border-b border-[#101B30] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#167D80] flex items-center justify-center text-white shadow-xs">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                DataTrust <span className="text-[#8FD2C4]">Ops</span>
              </h1>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#101B30] text-[#8FD2C4] border border-[#1F3252]">
                Demo Mode
              </span>
            </div>
          </div>

          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-[#8A94A6] hover:text-white hover:bg-[#101B30]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] uppercase font-semibold tracking-wider text-[#8A94A6]">
            Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#167D80] text-white shadow-sm'
                    : 'text-[#D8D2C7] hover:bg-[#101B30] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#8FD2C4]'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge != null && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      isActive ? 'bg-[#101B30] text-[#8FD2C4]' : 'bg-[#B77936] text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Status & Info Section */}
        <div className="p-4 border-t border-[#101B30] bg-[#101B30]/60 space-y-2.5 text-xs">
          {/* Database Connectivity Status Button */}
          <button
            onClick={onOpenAtlasGuide}
            className="w-full flex items-center justify-between p-2 rounded-lg bg-[#17263F] border border-[#1F3252] text-[#D8D2C7] hover:border-[#8FD2C4] transition text-left"
            title={dbConnected ? 'MongoDB Online (Click for setup guide)' : 'MongoDB Disconnected (Click for setup guide)'}
          >
            <div className="flex items-center gap-2 truncate">
              <span className={`w-2 h-2 rounded-full shrink-0 ${dbConnected ? 'bg-[#8FD2C4]' : 'bg-[#B77936]'}`} />
              <span className="font-mono text-[11px] truncate">
                {dbConnected ? 'MongoDB: Online' : 'DB: In-Memory'}
              </span>
            </div>
            <Info className="w-3.5 h-3.5 text-[#8A94A6] shrink-0" />
          </button>

          {/* Scoring Formula Link */}
          <button
            onClick={onOpenFormulaDoc}
            className="w-full flex items-center gap-2 p-2 rounded-lg text-[#8A94A6] hover:text-white hover:bg-[#17263F] transition text-left"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#8FD2C4]" />
            <span className="text-[11px]">Scoring Formula Docs</span>
          </button>

          {/* System Environment Note */}
          <div className="text-[10px] text-[#8A94A6] font-mono px-1">
            DataTrust Ops v1.0 &bull; ExaThon
          </div>
        </div>
      </aside>
    </>
  );
}
