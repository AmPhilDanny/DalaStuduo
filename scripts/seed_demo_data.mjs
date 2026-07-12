/**
 * Sprint 5 — Seed Demo Data for SkillBridge Africa
 *
 * Creates:
 *   3-5 realistic demo profiles (Nigerian names, skills, locations)
 *   2-3 demo projects with roles
 *   1-2 demo job listings
 *
 * Usage: node scripts/seed_demo_data.mjs
 * Requires .env with VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

// Load .env manually
const envRaw = readFileSync(resolve(root, '.env'), 'utf-8');
const env = Object.fromEntries(
  envRaw
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => {
      const [k, ...v] = l.split('=');
      return [k.trim(), v.join('=').trim()];
    })
);

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Demo Users ──────────────────────────────────────────────
const DEMO_USERS = [
  {
    email: 'sarah.johnson@example.com',
    password: 'DemoPass123!',
    profile: {
      role: 'student',
      full_name: 'Sarah Johnson',
      headline: 'Full-Stack Developer & UI/UX Enthusiast',
      location: 'Lagos, Nigeria',
      github_url: 'https://github.com/sarahj',
      skills: ['React', 'TypeScript', 'Tailwind CSS', 'Node.js', 'Figma'],
      availability: 'open_to_work',
      bio: 'Passionate about building beautiful, accessible web applications. Final-year Computer Science student at University of Lagos.',
    },
  },
  {
    email: 'david.okafor@example.com',
    password: 'DemoPass123!',
    profile: {
      role: 'student',
      full_name: 'David Okafor',
      headline: 'Mobile Developer & AI Enthusiast',
      location: 'Abuja, Nigeria',
      github_url: 'https://github.com/davidoka',
      skills: ['Flutter', 'Python', 'TensorFlow', 'Firebase', 'Dart'],
      availability: 'open_to_collab',
      bio: 'Building the next generation of African tech solutions. Experience in mobile development and machine learning.',
    },
  },
  {
    email: 'amina.bello@example.com',
    password: 'DemoPass123!',
    profile: {
      role: 'student',
      full_name: 'Amina Bello',
      headline: 'Data Scientist & Technical Writer',
      location: 'Kano, Nigeria',
      github_url: 'https://github.com/aminabello',
      skills: ['Python', 'SQL', 'Pandas', 'Machine Learning', 'Data Visualization'],
      availability: 'open_to_work',
      bio: 'Data scientist with a passion for turning complex data into actionable insights. Microsoft Learn Student Ambassador.',
    },
  },
  {
    email: 'techcorp.ng@example.com',
    password: 'DemoPass123!',
    profile: {
      role: 'firm',
      full_name: 'TechCorp Nigeria',
      company_name: 'TechCorp Nigeria Ltd',
      headline: 'Leading Software Consultancy in West Africa',
      location: 'Lagos, Nigeria',
      skills: ['React', 'Python', 'DevOps', 'Cloud', 'Mobile'],
      availability: 'open_to_collab',
      bio: 'We build enterprise software solutions for African businesses. Always looking for talented interns and part-time developers.',
    },
  },
  {
    email: 'chidi.okonkwo@example.com',
    password: 'DemoPass123!',
    profile: {
      role: 'student',
      full_name: 'Chidi Okonkwo',
      headline: 'Backend Engineer & DevOps Learner',
      location: 'Enugu, Nigeria',
      github_url: 'https://github.com/chidio',
      skills: ['Go', 'Docker', 'PostgreSQL', 'AWS', 'GraphQL'],
      availability: 'open_to_work',
      bio: 'Backend developer focused on scalable systems. Currently exploring cloud-native architectures and Kubernetes.',
    },
  },
];

// ── Demo Projects ───────────────────────────────────────────
const DEMO_PROJECTS = [
  {
    title: 'E-Learning Platform for Local Languages',
    description:
      'A web app that teaches Nigerian languages (Hausa, Yoruba, Igbo) through interactive lessons and quizzes. Built with React and Firebase.',
    is_paid: false,
    roles: [
      { role_title: 'Frontend Developer', skills_needed: ['React', 'TypeScript', 'Tailwind CSS'] },
      { role_title: 'Content Creator', skills_needed: ['Writing', 'Linguistics', 'Curriculum Design'] },
    ],
    owner_email: 'sarah.johnson@example.com',
  },
  {
    title: 'FarmConnect — Marketplace for Farmers',
    description:
      'A mobile-first marketplace connecting small-scale farmers directly to buyers. Features real-time pricing and delivery tracking.',
    is_paid: false,
    roles: [
      { role_title: 'Flutter Developer', skills_needed: ['Flutter', 'Dart', 'Firebase'] },
      { role_title: 'UI/UX Designer', skills_needed: ['Figma', 'User Research', 'Prototyping'] },
    ],
    owner_email: 'david.okafor@example.com',
  },
  {
    title: 'AI-Powered Resume Reviewer',
    description:
      'An app that analyzes resumes against job descriptions using NLP and provides actionable improvement suggestions.',
    is_paid: true,
    roles: [
      { role_title: 'ML Engineer', skills_needed: ['Python', 'NLP', 'TensorFlow', 'FastAPI'] },
    ],
    owner_email: 'amina.bello@example.com',
  },
];

// ── Demo Jobs ───────────────────────────────────────────────
const DEMO_JOBS = [
  {
    company_email: 'techcorp.ng@example.com',
    title: 'Frontend Developer Intern',
    description:
      'Build responsive web interfaces using React and Tailwind CSS. Work with our design team to implement pixel-perfect UIs.',
    type: 'internship',
    location: 'Lagos, Nigeria',
    salary_range: '₦150,000 - ₦250,000/month',
    requirements: '- React experience\n- Tailwind CSS\n- Basic TypeScript\n- Portfolio of projects',
  },
  {
    company_email: 'techcorp.ng@example.com',
    title: 'Data Entry Specialist',
    description:
      'Accurate data entry and verification for our customer database. Remote position with flexible hours.',
    type: 'part-time',
    location: 'Remote',
    salary_range: '₦80,000 - ₦120,000/month',
    requirements: '- Fast typing (50+ WPM)\n- Attention to detail\n- Basic Excel/Google Sheets',
  },
];

// ── Seed Logic ──────────────────────────────────────────────
async function createUser(user) {
  // Check if user already exists
  const { data: existing } = await admin.auth.admin.listUsers();
  const found = existing.users.find((u) => u.email === user.email);
  if (found) {
    console.log(`  ↳ User ${user.email} already exists (id: ${found.id})`);
    return found;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: user.email,
    password: user.password,
    email_confirm: true,
    user_metadata: {
      full_name: user.profile.full_name,
      role: user.profile.role,
    },
  });

  if (error) {
    console.error(`  ✗ Failed to create user ${user.email}:`, error.message);
    return null;
  }

  console.log(`  ✓ Created user ${user.email} (id: ${data.user.id})`);
  return data.user;
}

async function seedProfile(authUser, profileData) {
  const { data: existing } = await admin
    .from('profiles')
    .select('id')
    .eq('id', authUser.id)
    .maybeSingle();

  if (existing) {
    // Update existing profile with enriched fields
    const { error } = await admin
      .from('profiles')
      .update({
        headline: profileData.headline,
        location: profileData.location,
        github_url: profileData.github_url || null,
        skills: profileData.skills,
        availability: profileData.availability,
        bio: profileData.bio,
      })
      .eq('id', authUser.id);

    if (error) {
      console.error(`  ✗ Failed to update profile for ${authUser.email}:`, error.message);
    } else {
      console.log(`  ✓ Updated profile for ${authUser.email}`);
    }
  } else {
    console.error(`  ✗ Profile not found for user ${authUser.email}. Trigger should have created it.`);
  }
}

async function seedProject(project, userMap) {
  const ownerId = userMap[project.owner_email];
  if (!ownerId) {
    console.error(`  ✗ Owner ${project.owner_email} not found, skipping project "${project.title}"`);
    return;
  }

  // Check if project already exists
  const { data: existing } = await admin
    .from('projects')
    .select('id')
    .eq('title', project.title)
    .maybeSingle();

  if (existing) {
    console.log(`  ↳ Project "${project.title}" already exists (id: ${existing.id})`);
    return;
  }

  const { data: proj, error } = await admin
    .from('projects')
    .insert({
      owner_id: ownerId,
      title: project.title,
      description: project.description,
      is_paid: project.is_paid,
      status: 'open',
    })
    .select()
    .single();

  if (error) {
    console.error(`  ✗ Failed to create project "${project.title}":`, error.message);
    return;
  }

  console.log(`  ✓ Created project "${project.title}" (id: ${proj.id})`);

  // Seed roles
  for (const role of project.roles) {
    const { error: roleErr } = await admin
      .from('project_roles')
      .insert({
        project_id: proj.id,
        role_title: role.role_title,
        skills_needed: role.skills_needed,
      });

    if (roleErr) {
      console.error(`  ✗ Failed to create role "${role.role_title}":`, roleErr.message);
    } else {
      console.log(`    ✓ Role "${role.role_title}" created`);
    }
  }
}

async function seedJob(job, userMap) {
  const companyId = userMap[job.company_email];
  if (!companyId) {
    console.error(`  ✗ Company ${job.company_email} not found, skipping job "${job.title}"`);
    return;
  }

  // Check if job already exists
  const { data: existing } = await admin
    .from('jobs')
    .select('id')
    .eq('title', job.title)
    .maybeSingle();

  if (existing) {
    console.log(`  ↳ Job "${job.title}" already exists (id: ${existing.id})`);
    return;
  }

  const { error } = await admin
    .from('jobs')
    .insert({
      company_id: companyId,
      title: job.title,
      description: job.description,
      type: job.type,
      location: job.location,
      salary_range: job.salary_range,
      requirements: job.requirements,
      is_active: true,
    });

  if (error) {
    console.error(`  ✗ Failed to create job "${job.title}":`, error.message);
  } else {
    console.log(`  ✓ Created job "${job.title}"`);
  }
}

async function main() {
  console.log('\n=== SkillBridge Africa — Seed Demo Data ===\n');

  // 1. Create auth users
  console.log('── Users ──');
  const userMap = {};
  for (const user of DEMO_USERS) {
    const authUser = await createUser(user);
    if (authUser) {
      userMap[user.email] = authUser.id;
    }
  }

  // 2. Update profiles with enriched data
  console.log('\n── Profiles ──');
  for (const user of DEMO_USERS) {
    if (userMap[user.email]) {
      await seedProfile({ id: userMap[user.email], email: user.email }, user.profile);
    }
  }

  // 3. Seed projects
  console.log('\n── Projects ──');
  for (const project of DEMO_PROJECTS) {
    await seedProject(project, userMap);
  }

  // 4. Seed jobs
  console.log('\n── Jobs ──');
  for (const job of DEMO_JOBS) {
    await seedJob(job, userMap);
  }

  console.log('\n── Summary ──');
  console.log(`  Users created/verified: ${Object.keys(userMap).length}`);
  console.log(`  Demo accounts password: DemoPass123!`);
  console.log('\nDone! Open http://localhost:3000/auth to sign in.');
}

main().catch(console.error);
