import { Link, Outlet, useLocation } from 'react-router-dom';
import { 
  Ship, 
  BarChart3, 
  Brain, 
  Calculator, 
  Settings, 
  Download,
  Home
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'ホーム', icon: Home },
  { path: '/races', label: 'レース一覧', icon: Ship },
  { path: '/predictions', label: '予想', icon: Brain },
  { path: '/statistics', label: '統計', icon: BarChart3 },
  { path: '/scraper', label: 'データ取得', icon: Download },
  { path: '/settings', label: '設定', icon: Settings },
];

export default function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-dark-300 flex">
      {/* サイドバー */}
      <aside className="w-64 bg-dark-200 border-r border-gray-800 flex flex-col">
        {/* ロゴ */}
        <div className="p-6 border-b border-gray-800">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
              <Ship className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">BOAT RACE</h1>
              <p className="text-xs text-gray-400">AI Predictor</p>
            </div>
          </Link>
        </div>

        {/* ナビゲーション */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                      ${isActive 
                        ? 'bg-blue-600/20 text-blue-400 border-l-4 border-blue-500' 
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* フッター */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Calculator className="w-4 h-4" />
            <span>統計 + 機械学習予想</span>
          </div>
        </div>
      </aside>

      {/* メインコンテンツ */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
