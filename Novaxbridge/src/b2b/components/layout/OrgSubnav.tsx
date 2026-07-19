import { NavLink } from 'react-router-dom';

const orgNavItems = [
  { to: '/b2b/team', label: 'Team' },
  { to: '/b2b/talent', label: 'Talent Pool' },
  { to: '/b2b/talent/lists', label: 'Lists' },
  { to: '/b2b/hiring', label: 'Hiring' },
  { to: '/b2b/hiring/pipeline', label: 'Pipeline' },
  { to: '/b2b/contracts', label: 'Contracts' },
  { to: '/b2b/compliance', label: 'Compliance' },
  { to: '/b2b/analytics', label: 'Analytics' },
  { to: '/b2b/settings', label: 'Settings' },
];

export default function OrgSubnav() {
  return (
    <div className="sticky top-16 z-30 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto max-w-6xl px-4 lg:px-8">
        <div className="flex items-center gap-6 overflow-x-auto">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 whitespace-nowrap py-3 mr-2">
            Organization
          </span>
          <nav className="flex items-center gap-1">
            {orgNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `whitespace-nowrap px-3 py-3 text-sm font-medium transition-colors border-b-2 ${
                    isActive
                      ? 'border-purple-600 text-purple-700'
                      : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
