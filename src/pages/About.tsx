import { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Target, Eye, Heart, Users, Award, BookOpen } from 'lucide-react';

const VALUES = [
  { icon: Target, title: 'Our Mission', desc: 'Empower every African talent to access global opportunities through skill development and marketplace connections.' },
  { icon: Eye, title: 'Our Vision', desc: 'A world where talent knows no borders — where Africans can build careers, find work, and thrive from anywhere.' },
  { icon: Heart, title: 'Integrity', desc: 'We build trust through transparency, fair practices, and honest communication with our community.' },
  { icon: Users, title: 'Community', desc: 'We believe in the power of connection — bringing together learners, freelancers, employers, and mentors.' },
  { icon: Award, title: 'Excellence', desc: 'We hold ourselves to the highest standards in technology, service, and outcomes for our users.' },
  { icon: BookOpen, title: 'Continuous Learning', desc: 'The future belongs to those who learn, unlearn, and relearn. We champion growth at every level.' },
];

export default function About() {
  useEffect(() => {
    document.title = 'About Us | Dala';
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight mb-4">About Dala</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Dala is Africa's premier talent and opportunity marketplace — connecting skilled professionals
          with employers, projects, and learning resources that transform careers.
        </p>
      </div>

      {/* Story Section */}
      <div className="mb-16">
        <h2 className="text-2xl font-semibold mb-6">Our Story</h2>
        <div className="prose prose-gray max-w-none">
          <p className="text-muted-foreground leading-relaxed mb-4">
            Founded in 2024, Dala was born from a simple observation: Africa is home to some of the world's
            most talented professionals, yet they face systemic barriers to accessing global opportunities.
            Traditional job platforms don't account for the unique challenges of the African market —
            from payment infrastructure to skills verification.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            We built Dala to bridge that gap. What started as a freelance marketplace has grown into a
            comprehensive ecosystem encompassing job listings, project collaboration, skills development
            through our AI tutor, and a B2B platform for organizations to manage their workforce.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Today, Dala serves thousands of users across the continent, processing millions in transactions
            and facilitating connections that change lives and build careers.
          </p>
        </div>
      </div>

      {/* Values Grid */}
      <div className="mb-16">
        <h2 className="text-2xl font-semibold mb-6 text-center">What We Stand For</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {VALUES.map((v) => {
            const Icon = v.icon;
            return (
              <Card key={v.title} className="border hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{v.title}</h3>
                  <p className="text-sm text-muted-foreground">{v.desc}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Team Section */}
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-4">Join Our Journey</h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          We're building the future of work in Africa — and we'd love for you to be part of it.
          Whether you're a talent looking for opportunity, an employer seeking top skills, or an
          investor backing the next wave of innovation, there's a place for you at Dala.
        </p>
      </div>
    </div>
  );
}
