const fs = require('fs');
const files = [
  'admin/src/components/layout/Navbar.tsx',
  'admin/src/components/layout/Footer.tsx'
];
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/<Link\s+to="([^"]+)"/g, '<a href="http://localhost:3000$1"');
  content = content.replace(/<Link\s+to=\{([^}]+)\}/g, '<a href={`http://localhost:3000${$1}`}');
  content = content.replace(/<\/Link>/g, '</a>');
  content = content.replace(/navigate\('(\/[^']+)'\)/g, 'window.location.href = \'http://localhost:3000$1\'');
  content = content.replace(/href="(\/[^"]*)"/g, 'href="http://localhost:3000$1"');
  fs.writeFileSync(file, content);
  console.log('Updated ' + file);
}
