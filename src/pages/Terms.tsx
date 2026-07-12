import { useEffect } from 'react';
import { Separator } from '@/components/ui/separator';

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    content: 'By accessing or using Dala ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Platform. We reserve the right to update these terms at any time; continued use constitutes acceptance of changes.',
  },
  {
    title: '2. Account Registration',
    content: 'You must create an account to use certain features. You are responsible for maintaining the confidentiality of your login credentials and for all activities under your account. You must provide accurate, current, and complete information.',
  },
  {
    title: '3. User Conduct',
    content: 'You agree not to: (a) violate any laws or regulations; (b) impersonate any person or entity; (c) post false, misleading, or fraudulent content; (d) harass, abuse, or harm others; (e) interfere with the Platform\'s operation; (f) scrape or collect user data without consent.',
  },
  {
    title: '4. Services and Fees',
    content: 'Dala provides a marketplace connecting freelancers, job seekers, employers, and learners. We charge service fees on completed transactions as disclosed at the time of engagement. All fees are non-refundable except as expressly stated in our refund policy.',
  },
  {
    title: '5. Intellectual Property',
    content: 'Content you post remains yours. By posting, you grant Dala a license to display and distribute it on the Platform. You represent that you own or have rights to all content you submit. Dala\'s trademarks, logo, and brand elements may not be used without permission.',
  },
  {
    title: '6. Payments and Disputes',
    content: 'All payments are processed through our secure payment system. Escrow payments are held until project milestones are approved by both parties. Disputes are resolved through our mediation process as outlined in our Dispute Resolution Policy.',
  },
  {
    title: '7. Limitation of Liability',
    content: 'Dala is provided "as is" without warranties of any kind. To the maximum extent permitted by law, Dala shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Platform.',
  },
  {
    title: '8. Termination',
    content: 'Either party may terminate your account at any time for violation of these terms. Upon termination, you lose access to your account and content. Completed transactions and obligations survive termination.',
  },
  {
    title: '9. Governing Law',
    content: 'These terms are governed by the laws of the Federal Republic of Nigeria. Any disputes shall be resolved through arbitration in Lagos, Nigeria, in accordance with the Arbitration and Conciliation Act.',
  },
  {
    title: '10. Contact',
    content: 'For questions about these terms, contact us at legal@trydala.com or through our Contact page. We aim to respond within 5 business days.',
  },
];

export default function Terms() {
  useEffect(() => {
    document.title = 'Terms of Service | Dala';
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Terms of Service</h1>
        <p className="text-muted-foreground">Last updated: July 11, 2026</p>
      </div>

      <p className="text-muted-foreground mb-8 leading-relaxed">
        Please read these Terms of Service carefully before using the Dala platform. By using Dala,
        you agree to these terms. If you do not agree, please do not use our services.
      </p>

      <div className="space-y-8">
        {SECTIONS.map((s) => (
          <div key={s.title}>
            <h2 className="text-xl font-semibold mb-2">{s.title}</h2>
            <p className="text-muted-foreground leading-relaxed">{s.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
