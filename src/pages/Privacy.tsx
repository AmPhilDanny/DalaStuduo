import { useEffect } from 'react';

const SECTIONS = [
  {
    title: '1. Information We Collect',
    content: 'We collect information you provide when creating an account, including your name, email address, phone number, and profile details. We also collect usage data such as pages visited, actions taken, and interactions with other users. Payment information is processed by our secure payment partners and is not stored on our servers.',
  },
  {
    title: '2. How We Use Your Information',
    content: 'We use your information to: provide and improve our services; personalize your experience; process transactions; communicate with you about your account; send relevant opportunities and updates; detect and prevent fraud; comply with legal obligations.',
  },
  {
    title: '3. Data Sharing',
    content: 'We do not sell your personal information. We may share data with: other users as necessary for platform functionality (e.g., employers see your profile when you apply); service providers who assist our operations; law enforcement when required by law. All sharing is governed by strict data protection agreements.',
  },
  {
    title: '4. Data Security',
    content: 'We implement industry-standard security measures including encryption in transit (TLS 1.3) and at rest, secure authentication, regular security audits, and access controls. However, no system is 100% secure. We encourage you to use strong passwords and enable two-factor authentication.',
  },
  {
    title: '5. Your Rights',
    content: 'You have the right to: access your personal data; correct inaccurate data; delete your account and associated data; export your data in a portable format; withdraw consent for data processing; object to automated decision-making. Exercise these rights through your account settings or by contacting us.',
  },
  {
    title: '6. Cookies and Tracking',
    content: 'We use essential cookies for platform functionality and analytics cookies to improve our service. You can control cookie preferences through your browser settings. Disabling certain cookies may affect platform performance.',
  },
  {
    title: '7. Data Retention',
    content: 'We retain your data for as long as your account is active. After account deletion, we retain necessary data for legal and audit purposes for up to 90 days, after which it is permanently deleted or anonymized.',
  },
  {
    title: '8. Third-Party Services',
    content: 'Our platform integrates with third-party services for payments, communications, and analytics. These services have their own privacy policies governing data handling. We encourage you to review their policies.',
  },
  {
    title: '9. Children\'s Privacy',
    content: 'Dala is not intended for users under 16 years of age. We do not knowingly collect data from children. If we become aware of a child\'s data on our platform, we will promptly delete it.',
  },
  {
    title: '10. Updates to This Policy',
    content: 'We may update this privacy policy periodically. Material changes will be notified via email or platform notification. Continued use after changes constitutes acceptance of the updated policy.',
  },
  {
    title: '11. Contact Us',
    content: 'For privacy-related inquiries, contact our Data Protection Officer at privacy@trydala.com or through our Contact page. We respond to privacy requests within 30 days.',
  },
];

export default function Privacy() {
  useEffect(() => {
    document.title = 'Privacy Policy | Dala';
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Privacy Policy</h1>
        <p className="text-muted-foreground">Last updated: July 11, 2026</p>
      </div>

      <p className="text-muted-foreground mb-8 leading-relaxed">
        At Dala, we take your privacy seriously. This policy explains how we collect, use, protect,
        and handle your personal information in connection with our services.
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
