export default function JsonLd() {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://skillbridge.africa';

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${origin}/#organization`,
        name: 'SkillBridge Africa',
        url: origin,
        description:
          'Premium tech-skill bridging platform connecting African students with industry opportunities.',
        foundingDate: '2024',
      },
      {
        '@type': 'WebApplication',
        '@id': `${origin}/#webapp`,
        name: 'SkillBridge Africa Marketplace',
        url: origin,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
