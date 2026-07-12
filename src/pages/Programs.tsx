import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Code, Database, Layout, Cloud, Smartphone, Shield, Terminal, Hexagon, ArrowRight, Check, X, GraduationCap, Clock, DollarSign, BookOpen } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Program {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  icon: React.ReactNode;
  duration: string;
  level: string;
  price: string;
  curriculum: string[];
  prerequisites: string[];
  careers: string[];
}

const programs: Program[] = [
  {
    id: 'full-stack-web-development',
    title: 'Full-Stack Web Development',
    description: 'Master React, Node.js, and modern web architecture to build scalable applications.',
    longDescription: 'Dive deep into modern full-stack development. From responsive frontends with React to robust backends with Node.js, you will build real-world projects that demonstrate your ability to create complete web applications from scratch.',
    icon: <Code className="w-6 h-6" />,
    duration: '24 Weeks',
    level: 'Intermediate',
    price: '₦250,000',
    curriculum: [
      'HTML/CSS & Responsive Design Fundamentals',
      'JavaScript ES6+ & TypeScript',
      'React.js with Hooks & State Management',
      'Node.js & Express.js Backend Development',
      'PostgreSQL & MongoDB Database Design',
      'REST APIs & GraphQL Integration',
      'Docker, CI/CD & Cloud Deployment',
      'Capstone: Full-Stack SaaS Application',
    ],
    prerequisites: ['Basic understanding of HTML/CSS', 'Familiarity with programming concepts', 'A laptop with minimum 8GB RAM'],
    careers: ['Full-Stack Developer', 'Frontend Engineer', 'Backend Developer', 'Technical Lead'],
  },
  {
    id: 'data-science-ai',
    title: 'Data Science & AI',
    description: 'Learn Python, machine learning, and data visualization to solve complex problems.',
    longDescription: 'Transform raw data into actionable insights. This program covers the complete data science pipeline from collection and cleaning to modeling and deployment, with a focus on real-world applications.',
    icon: <Database className="w-6 h-6" />,
    duration: '20 Weeks',
    level: 'Beginner Friendly',
    price: '₦200,000',
    curriculum: [
      'Python for Data Science & Pandas',
      'Statistical Analysis & Probability',
      'Data Visualization with Matplotlib & Seaborn',
      'Machine Learning with Scikit-learn',
      'Deep Learning with TensorFlow',
      'NLP & Computer Vision Basics',
      'Model Deployment with FastAPI',
      'Capstone: End-to-End ML Pipeline',
    ],
    prerequisites: ['Basic math skills', 'No prior programming experience needed'],
    careers: ['Data Scientist', 'Machine Learning Engineer', 'Data Analyst', 'AI Researcher'],
  },
  {
    id: 'ui-ux-product-design',
    title: 'UI/UX Product Design',
    description: 'Design intuitive digital experiences using Figma, user research, and prototyping.',
    longDescription: 'Learn the art and science of digital product design. From user research to high-fidelity prototypes, you will master the tools and methodologies used by top design teams around the world.',
    icon: <Layout className="w-6 h-6" />,
    duration: '12 Weeks',
    level: 'All Levels',
    price: '₦150,000',
    curriculum: [
      'Design Thinking & User Research',
      'Information Architecture & Wireframing',
      'Visual Design & Design Systems',
      'Figma Mastery & Component Libraries',
      'Prototyping & User Testing',
      'Interaction Design & Micro-animations',
      'Portfolio Building & Case Studies',
      'Capstone: Full Product Redesign',
    ],
    prerequisites: ['No prior design experience needed', 'Creative mindset', 'Access to Figma (free tier)'],
    careers: ['UI/UX Designer', 'Product Designer', 'UX Researcher', 'Design Lead'],
  },
  {
    id: 'cloud-infrastructure',
    title: 'Cloud Infrastructure',
    description: 'Deploy and manage applications on AWS, Azure, and Google Cloud Platform.',
    longDescription: 'Become a cloud infrastructure expert. Learn to design, deploy, and manage scalable infrastructure across major cloud providers, with hands-on experience in real cloud environments.',
    icon: <Cloud className="w-6 h-6" />,
    duration: '16 Weeks',
    level: 'Advanced',
    price: '₦300,000',
    curriculum: [
      'Cloud Computing Fundamentals (AWS/Azure/GCP)',
      'Infrastructure as Code with Terraform',
      'Kubernetes & Container Orchestration',
      'CI/CD Pipelines & Automation',
      'Monitoring, Logging & Alerting',
      'Security & Compliance in the Cloud',
      'Cloud Architecture & Cost Optimization',
      'Capstone: Multi-Cloud Infrastructure Design',
    ],
    prerequisites: ['Experience with Linux command line', 'Basic networking knowledge', 'Familiarity with at least one programming language'],
    careers: ['Cloud Architect', 'DevOps Engineer', 'Site Reliability Engineer', 'Cloud Security Engineer'],
  },
  {
    id: 'mobile-app-development',
    title: 'Mobile App Development',
    description: 'Build cross-platform mobile apps with React Native and Flutter for iOS and Android.',
    longDescription: 'Create beautiful, performant mobile applications that run on both iOS and Android. Master React Native and Flutter to build apps that users love, from concept to App Store deployment.',
    icon: <Smartphone className="w-6 h-6" />,
    duration: '20 Weeks',
    level: 'Intermediate',
    price: '₦280,000',
    curriculum: [
      'Mobile UI Fundamentals & Design Patterns',
      'React Native Core Components & APIs',
      'State Management with Redux & Context',
      'Native Modules & Platform-Specific Code',
      'Firebase Integration & Backend Services',
      'App Store & Play Store Deployment',
      'Performance Optimization & Testing',
      'Capstone: Full Mobile Application',
    ],
    prerequisites: ['JavaScript/TypeScript basics', 'Understanding of React concepts'],
    careers: ['Mobile Developer', 'React Native Developer', 'Cross-Platform Engineer', 'Mobile Tech Lead'],
  },
  {
    id: 'cybersecurity-ethical-hacking',
    title: 'Cybersecurity & Ethical Hacking',
    description: 'Master network security, penetration testing, and ethical hacking methodologies.',
    longDescription: 'Defend against cyber threats by learning to think like an attacker. This hands-on program covers everything from network security to penetration testing, preparing you for in-demand security roles.',
    icon: <Shield className="w-6 h-6" />,
    duration: '16 Weeks',
    level: 'Advanced',
    price: '₦350,000',
    curriculum: [
      'Network Security Fundamentals',
      'Vulnerability Assessment & Scanning',
      'Penetration Testing Methodologies',
      'Web Application Security & OWASP Top 10',
      'Social Engineering & Red Teaming',
      'Digital Forensics & Incident Response',
      'Security Operations & SIEM Tools',
      'Capstone: Full Security Audit & Report',
    ],
    prerequisites: ['Strong networking knowledge', 'Linux proficiency', 'At least one scripting language (Python preferred)'],
    careers: ['Penetration Tester', 'Security Analyst', 'SOC Engineer', 'Cybersecurity Consultant'],
  },
  {
    id: 'devops-site-reliability',
    title: 'DevOps & Site Reliability',
    description: 'Learn CI/CD, containerization, monitoring, and infrastructure as code.',
    longDescription: 'Bridge the gap between development and operations. Master the tools and practices that enable rapid, reliable software delivery at scale, from version control to production monitoring.',
    icon: <Terminal className="w-6 h-6" />,
    duration: '14 Weeks',
    level: 'Intermediate',
    price: '₦220,000',
    curriculum: [
      'Git & Version Control Best Practices',
      'Docker & Container Management',
      'Kubernetes Orchestration',
      'CI/CD Pipeline Design & Implementation',
      'Infrastructure as Code (Terraform/Ansible)',
      'Observability: Monitoring, Logging & Tracing',
      'Incident Management & SRE Practices',
      'Capstone: Production-Grade Pipeline',
    ],
    prerequisites: ['Command line proficiency', 'Basic scripting skills', 'Understanding of web applications'],
    careers: ['DevOps Engineer', 'Site Reliability Engineer', 'Platform Engineer', 'Release Manager'],
  },
  {
    id: 'blockchain-web3-development',
    title: 'Blockchain & Web3 Development',
    description: 'Build decentralized apps, smart contracts, and understand blockchain architecture.',
    longDescription: 'Step into the future of the internet. Learn blockchain fundamentals, develop smart contracts, and build decentralized applications that leverage the power of Web3 technology.',
    icon: <Hexagon className="w-6 h-6" />,
    duration: '18 Weeks',
    level: 'All Levels',
    price: '₦270,000',
    curriculum: [
      'Blockchain Fundamentals & Cryptography',
      'Smart Contract Development with Solidity',
      'Ethereum & EVM Compatible Chains',
      'Web3.js & Ethers.js Integration',
      'dApp Frontend Development',
      'DeFi Protocols & NFT Standards',
      'Security Auditing for Smart Contracts',
      'Capstone: Full dApp Deployment',
    ],
    prerequisites: ['JavaScript/TypeScript experience', 'Basic understanding of web development'],
    careers: ['Blockchain Developer', 'Smart Contract Engineer', 'Web3 Full-Stack Developer', 'DeFi Analyst'],
  },
];

const levelColors: Record<string, string> = {
  'Beginner Friendly': 'bg-green-500/15 text-green-700',
  'Intermediate': 'bg-blue-500/15 text-blue-700',
  'Advanced': 'bg-purple-500/15 text-purple-700',
  'All Levels': 'bg-orange-500/15 text-orange-700',
};

const iconColors: Record<string, string> = {
  'Full-Stack Web Development': 'bg-blue-500/10 text-blue-600 group-hover:bg-blue-500 group-hover:text-white',
  'Data Science & AI': 'bg-orange-500/10 text-orange-600 group-hover:bg-orange-500 group-hover:text-white',
  'UI/UX Product Design': 'bg-pink-500/10 text-pink-600 group-hover:bg-pink-500 group-hover:text-white',
  'Cloud Infrastructure': 'bg-cyan-500/10 text-cyan-600 group-hover:bg-cyan-500 group-hover:text-white',
  'Mobile App Development': 'bg-indigo-500/10 text-indigo-600 group-hover:bg-indigo-500 group-hover:text-white',
  'Cybersecurity & Ethical Hacking': 'bg-red-500/10 text-red-600 group-hover:bg-red-500 group-hover:text-white',
  'DevOps & Site Reliability': 'bg-amber-500/10 text-amber-600 group-hover:bg-amber-500 group-hover:text-white',
  'Blockchain & Web3 Development': 'bg-emerald-500/10 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white',
};

export default function Programs() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);

  // Auto-open modal if navigated with an ID
  useEffect(() => {
    if (id) {
      const found = programs.find(p => p.id === id);
      if (found) setSelectedProgram(found);
    }
  }, [id]);

  const handleApply = (program: Program) => {
    if (!user) {
      navigate(`/auth?redirect=/programs/${program.id}`);
      return;
    }
    toast.success(`Application submitted for ${program.title}! We'll contact you soon.`);
    setSelectedProgram(null);
  };

  const openDetails = (program: Program) => {
    setSelectedProgram(program);
    // Update URL without full navigation
    window.history.replaceState(null, '', `/programs/${program.id}`);
  };

  const closeDetails = () => {
    setSelectedProgram(null);
    window.history.replaceState(null, '', '/programs');
  };

  return (
    <div className="min-h-screen pt-20 pb-16">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-primary/5 via-secondary/5 to-primary/10 border-b border-border">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-4">8 Programs Available</Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">Our Programs</h1>
            <p className="text-lg text-muted-foreground">
              Intensive, project-based tracks designed to get you job-ready in months, not years. 
              Each program is crafted with industry partners to ensure you learn exactly what employers need.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="border-b border-border bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">8</p>
              <p className="text-sm text-muted-foreground">Programs</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">20</p>
              <p className="text-sm text-muted-foreground">Weeks Avg Duration</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">85%</p>
              <p className="text-sm text-muted-foreground">Employment Rate</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">150+</p>
              <p className="text-sm text-muted-foreground">Partner Companies</p>
            </div>
          </div>
        </div>
      </div>

      {/* Programs Grid */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {programs.map((program, index) => (
            <motion.div
              key={program.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="h-full flex flex-col border-border/50 hover:border-secondary/50 transition-colors group">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 transition-colors ${iconColors[program.title] || 'bg-secondary/10 text-secondary'}`}>
                    {program.icon}
                  </div>
                  <Badge variant="secondary" className={`w-fit mb-2 ${levelColors[program.level] || ''}`}>
                    {program.level}
                  </Badge>
                  <CardTitle className="text-lg">{program.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {program.description}
                  </p>
                  <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {program.duration}</span>
                    <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> {program.price}</span>
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2 border-t pt-4">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openDetails(program)}>
                    <BookOpen className="w-3 h-3 mr-1" /> Details
                  </Button>
                  <Button size="sm" className="flex-1" onClick={() => handleApply(program)}>
                    Apply Now <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Program Detail Dialog */}
      <Dialog open={!!selectedProgram} onOpenChange={(open) => { if (!open) closeDetails(); }}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedProgram && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconColors[selectedProgram.title]?.replace(' group-hover:bg-', ' bg-').replace(' group-hover:text-white', '') || 'bg-secondary/10 text-secondary'}`}>
                    {selectedProgram.icon}
                  </div>
                  <div>
                    <Badge variant="secondary" className={levelColors[selectedProgram.level]}>
                      {selectedProgram.level}
                    </Badge>
                  </div>
                </div>
                <DialogTitle className="text-2xl">{selectedProgram.title}</DialogTitle>
                <DialogDescription className="text-base text-foreground/80 mt-2">
                  {selectedProgram.longDescription}
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg mb-4">
                <div className="text-center">
                  <Clock className="w-4 h-4 mx-auto text-secondary mb-1" />
                  <p className="text-xs text-muted-foreground">Duration</p>
                  <p className="text-sm font-semibold">{selectedProgram.duration}</p>
                </div>
                <div className="text-center">
                  <DollarSign className="w-4 h-4 mx-auto text-secondary mb-1" />
                  <p className="text-xs text-muted-foreground">Tuition</p>
                  <p className="text-sm font-semibold">{selectedProgram.price}</p>
                </div>
                <div className="text-center">
                  <GraduationCap className="w-4 h-4 mx-auto text-secondary mb-1" />
                  <p className="text-xs text-muted-foreground">Level</p>
                  <p className="text-sm font-semibold">{selectedProgram.level}</p>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                  <BookOpen className="w-4 h-4 text-secondary" /> Curriculum
                </h4>
                <ul className="space-y-1.5">
                  {selectedProgram.curriculum.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Prerequisites</h4>
                  <ul className="space-y-1">
                    {selectedProgram.prerequisites.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <div className="w-1 h-1 rounded-full bg-muted-foreground mt-2 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-2">Career Outcomes</h4>
                  <ul className="space-y-1">
                    {selectedProgram.careers.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <div className="w-1 h-1 rounded-full bg-secondary mt-2 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <Button size="lg" className="w-full mt-2" onClick={() => handleApply(selectedProgram)}>
                Apply Now - {selectedProgram.title} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
