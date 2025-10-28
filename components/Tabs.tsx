import React from 'react';

interface Tab {
  name: string;
  // FIX: Changed JSX.Element to React.ReactElement to fix "Cannot find namespace 'JSX'" error.
  icon: React.ReactElement;
  badgeCount?: number;
}
interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabClick: (tab: string) => void;
}

const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onTabClick }) => {
  return (
    <div className="bg-slate-100/80 p-1 rounded-lg flex space-x-1">
      {tabs.map((tab) => (
        <button
          key={tab.name}
          onClick={() => onTabClick(tab.name)}
          className={`${
            activeTab === tab.name
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-slate-600 hover:bg-white/60 hover:text-blue-600'
          } flex items-center justify-center space-x-2 flex-1 py-2.5 px-3 rounded-md font-semibold text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 relative`}
        >
          {tab.icon}
          <span>{tab.name}</span>
          {tab.badgeCount && tab.badgeCount > 0 && (
            <span className="absolute -top-1 -right-1 block h-5 w-5 rounded-full bg-red-500 text-white text-xs font-semibold flex items-center justify-center ring-2 ring-slate-100">
              {tab.badgeCount > 9 ? '9+' : tab.badgeCount}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

export default Tabs;