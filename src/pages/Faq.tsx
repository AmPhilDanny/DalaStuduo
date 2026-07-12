import { useEffect } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const FAQS = [
  {
    q: 'What is Dala?',
    a: 'Dala is an all-in-one talent and opportunity marketplace for African professionals. We connect freelancers, job seekers, employers, and learners through job listings, projects, tutoring, and B2B workforce management tools.',
  },
  {
    q: 'Is Dala free to use?',
    a: 'Creating an account and browsing opportunities on Dala is completely free. We charge a service fee on completed transactions and offer premium subscription plans for organizations that need advanced features like bulk job posting, analytics, and team management.',
  },
  {
    q: 'How do I get paid for completed work?',
    a: 'Payments are processed securely through our integrated payment system. Freelancers can withdraw earnings to their bank accounts or mobile money. Payment timelines depend on the project milestone terms agreed upon with the client.',
  },
  {
    q: 'What types of jobs are available?',
    a: 'Dala features a wide range of opportunities including freelance projects, full-time positions, contract work, and internships across tech, design, marketing, writing, finance, and more. Our AI matching system helps find opportunities that fit your skills.',
  },
  {
    q: 'How does the AI Tutor work?',
    a: 'Our AI Tutor provides personalized learning experiences to help you develop in-demand skills. It adapts to your learning pace, offers interactive exercises, and provides feedback on your progress. It\'s available to all registered users.',
  },
  {
    q: 'Can employers post jobs for free?',
    a: 'Employers can post individual jobs for free. For high-volume hiring needs, our B2B platform offers bulk job posting, team collaboration, pipeline management, and advanced analytics through affordable subscription plans.',
  },
  {
    q: 'How does dispute resolution work?',
    a: 'If a dispute arises between a client and freelancer, our mediation process helps both parties reach a fair resolution. We review project milestones, communications, and deliverables to make informed decisions.',
  },
  {
    q: 'Is my data secure on Dala?',
    a: 'Absolutely. We use industry-standard encryption, secure authentication, and follow data protection best practices. Your personal information is never shared without your consent. See our Privacy Policy for details.',
  },
  {
    q: 'How do I join as an organization?',
    a: 'Organizations can sign up through our B2B portal at /b2b/setup. You\'ll create your company profile, invite team members, and gain access to hiring tools, talent search, contract management, and compliance features.',
  },
  {
    q: 'What payment methods are supported?',
    a: 'We support bank transfers, mobile money, and card payments. Our platform works with major African payment providers to ensure seamless transactions across different countries and currencies.',
  },
  {
    q: 'Can I change my role after signing up?',
    a: 'Yes! You can update your profile settings to switch between freelancer, employer, or learner roles at any time. Your dashboard adapts to show relevant features based on your active role.',
  },
  {
    q: 'How do I contact support?',
    a: 'You can reach our support team through the Contact page, send an email to support@trydala.com, or use the in-app messaging system. We typically respond within 24 hours during business days.',
  },
];

export default function Faq() {
  useEffect(() => {
    document.title = 'FAQ | Dala';
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Frequently Asked Questions</h1>
        <p className="text-lg text-muted-foreground">
          Everything you need to know about Dala — find answers to common questions below.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full">
        {FAQS.map((faq, i) => (
          <AccordionItem key={i} value={`item-${i}`}>
            <AccordionTrigger className="text-left text-base font-medium">
              {faq.q}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed">
              {faq.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
