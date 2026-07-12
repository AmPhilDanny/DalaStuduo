const fs = require('fs');
const path = require('path');

// Re-copy the original Navbar from main src
const src = fs.readFileSync('src/components/layout/Navbar.tsx', 'utf8');

// Replace <Link to="..."> with <a href="http://localhost:3000...">
let c = src;

// Fix import - remove Link from react-router-dom imports since we won't use it
c = c.replace("import { Link, useNavigate, useLocation } from 'react-router-dom';",
  "import { useNavigate, useLocation } from 'react-router-dom';");

// Replace <Link to="/something" ... > with <a href="http://localhost:3000/something" ... >
// Handle the desktop nav links mapping (they use link.href which is already a string)
c = c.replace(
  `              <Link
                key={link.name}
                to={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className={\`text-sm font-medium transition-colors whitespace-nowrap \${
                  isActive
                    ? 'text-secondary font-semibold'
                    : 'text-muted-foreground hover:text-primary'
                }\`}
              >
                {link.name}
              </Link>`,
  `              <a
                key={link.name}
                href={\`http://localhost:3000\${link.href}\`}
                onClick={(e) => handleNavClick(e, link.href)}
                className={\`text-sm font-medium transition-colors whitespace-nowrap \${
                  isActive
                    ? 'text-secondary font-semibold'
                    : 'text-muted-foreground hover:text-primary'
                }\`}
              >
                {link.name}
              </a>`
);

// Mobile nav links
c = c.replace(
  `              <Link
                key={link.name}
                to={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className={\`text-lg font-medium transition-colors \${
                  isActive
                    ? 'text-secondary font-semibold'
                    : 'text-muted-foreground hover:text-primary'
                }\`}
              >
                {link.name}
              </Link>`,
  `              <a
                key={link.name}
                href={\`http://localhost:3000\${link.href}\`}
                onClick={(e) => handleNavClick(e, link.href)}
                className={\`text-lg font-medium transition-colors \${
                  isActive
                    ? 'text-secondary font-semibold'
                    : 'text-muted-foreground hover:text-primary'
                }\`}
              >
                {link.name}
              </a>`
);

// Brand logo link (to="/")
c = c.replace('<Link to="/" className="flex items-center gap-2">', '<a href="http://localhost:3000/" className="flex items-center gap-2">');
c = c.replace('</Link>', '</a>');

// All remaining <Link to="/path"> patterns - replace with <a href="http://localhost:3000/path">
// Profile link
c = c.replace('<Link to="/profile" className="cursor-pointer flex items-center gap-2">', '<a href="http://localhost:3000/profile" className="cursor-pointer flex items-center gap-2">');
c = c.replace('<Link to="/connections" className="cursor-pointer flex items-center gap-2">', '<a href="http://localhost:3000/connections" className="cursor-pointer flex items-center gap-2">');
c = c.replace('<Link to="/messages" className="cursor-pointer flex items-center gap-2">', '<a href="http://localhost:3000/messages" className="cursor-pointer flex items-center gap-2">');
c = c.replace(
  '<Link to={profile?.role === \'firm\' ? \'/dashboard/org\' : \'/dashboard\'} className="cursor-pointer flex items-center gap-2">',
  '<a href={`http://localhost:3000${profile?.role === \'firm\' ? \'/dashboard/org\' : \'/dashboard\'}`} className="cursor-pointer flex items-center gap-2">'
);
c = c.replace('<Link to="/b2b/setup" className="cursor-pointer flex items-center gap-2">', '<a href="http://localhost:3000/b2b/setup" className="cursor-pointer flex items-center gap-2">');
c = c.replace('<Link to="/jobs/new" className="cursor-pointer flex items-center gap-2">', '<a href="http://localhost:3000/jobs/new" className="cursor-pointer flex items-center gap-2">');
c = c.replace('<Link to="/orders" className="cursor-pointer flex items-center gap-2">', '<a href="http://localhost:3000/orders" className="cursor-pointer flex items-center gap-2">');
c = c.replace('<Link to="/wallet" className="cursor-pointer flex items-center gap-2">', '<a href="http://localhost:3000/wallet" className="cursor-pointer flex items-center gap-2">');
c = c.replace('<Link to="/my-listings" className="cursor-pointer flex items-center gap-2">', '<a href="http://localhost:3000/my-listings" className="cursor-pointer flex items-center gap-2">');
c = c.replace('<Link to="/disputes" className="cursor-pointer flex items-center gap-2">', '<a href="http://localhost:3000/disputes" className="cursor-pointer flex items-center gap-2">');

// Admin panel link -> port 4000
c = c.replace(
  '<Link to="/admin" className="cursor-pointer flex items-center gap-2">',
  '<a href="http://localhost:4000/" className="cursor-pointer flex items-center gap-2 w-full">'
);

// Mobile links
c = c.replace('<Link to="/orders"', '<a href="http://localhost:3000/orders"');
c = c.replace('<Link to="/disputes"', '<a href="http://localhost:3000/disputes"');
c = c.replace('<Link to="/wallet"', '<a href="http://localhost:3000/wallet"');
c = c.replace('<Link to="/my-listings"', '<a href="http://localhost:3000/my-listings"');
c = c.replace(
  'to={profile?.role === \'firm\' ? \'/dashboard/org\' : \'/dashboard\'}\n                   onClick={() => setIsMobileMenuOpen(false)}',
  'href={`http://localhost:3000${profile?.role === \'firm\' ? \'/dashboard/org\' : \'/dashboard\'}`}\n                   onClick={() => setIsMobileMenuOpen(false)}'
);
c = c.replace('<Link to="/jobs/new"\n                    onClick', '<a href="http://localhost:3000/jobs/new"\n                    onClick');
c = c.replace('<Link to="/profile"\n                   onClick', '<a href="http://localhost:3000/profile"\n                   onClick');
c = c.replace('<Link to="/my-applications"\n                   onClick', '<a href="http://localhost:3000/my-applications"\n                   onClick');

// navigate('/auth') -> window.location.href
c = c.replace("navigate('/auth')", "window.location.href = 'http://localhost:3000/auth'");

// Remaining Link closing tags
c = c.replace(/<\/Link>/g, '</a>');
// Remaining Link opening tags that we missed - catch-all
c = c.replace(/<Link\s+to="/g, '<a href="http://localhost:3000/');
c = c.replace(/<Link\s+/g, '<a ');

fs.writeFileSync('admin/src/components/layout/Navbar.tsx', c);
console.log('Navbar.tsx fixed successfully');
