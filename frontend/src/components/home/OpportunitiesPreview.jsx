import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { Briefcase, MapPin, ArrowRight, Clock, Building } from 'lucide-react';

const SkeletonOpportunityCard = () => (
  <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs animate-pulse space-y-4">
    <div className="flex justify-between items-start">
      <div className="w-12 h-12 bg-slate-200 rounded-xl" />
      <div className="w-20 h-6 bg-slate-200 rounded-full" />
    </div>
    <div className="space-y-2">
      <div className="w-3/4 h-5 bg-slate-200 rounded" />
      <div className="w-1/2 h-4 bg-slate-100 rounded" />
    </div>
    <div className="flex gap-2 pt-2">
      <div className="w-16 h-6 bg-slate-100 rounded-full" />
      <div className="w-16 h-6 bg-slate-100 rounded-full" />
    </div>
  </div>
);

const OpportunitiesPreview = () => {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    api.get('/public/opportunities')
      .then(res => {
        if (isMounted && Array.isArray(res.data) && res.data.length > 0) {
          setOpportunities(res.data);
        } else if (isMounted) {
          setOpportunities([
            {
              id: 'opp_demo_1',
              title: 'Frontend React Developer Intern',
              company: 'Codovate Partner Labs',
              location: 'Bangalore / Remote',
              type: 'Internship',
              salary: '₹25,000 / month',
              required_skills: ['React', 'TypeScript', 'Tailwind CSS'],
            },
            {
              id: 'opp_demo_2',
              title: 'Full Stack Engineer',
              company: 'TechCorp Innovation',
              location: 'Hyderabad, India',
              type: 'Full-time',
              salary: '12-15 LPA',
              required_skills: ['Node.js', 'Express', 'React'],
            },
            {
              id: 'opp_demo_3',
              title: 'UI/UX Design Intern',
              company: 'Design Studio',
              location: 'Remote',
              type: 'Internship',
              salary: '₹20,000 / month',
              required_skills: ['Figma', 'Prototyping', 'Design Systems'],
            },
          ]);
        }
      })
      .catch(() => {
        if (isMounted) {
          setOpportunities([
            {
              id: 'opp_demo_1',
              title: 'Frontend React Developer Intern',
              company: 'Codovate Partner Labs',
              location: 'Bangalore / Remote',
              type: 'Internship',
              salary: '₹25,000 / month',
              required_skills: ['React', 'TypeScript', 'Tailwind CSS'],
            },
            {
              id: 'opp_demo_2',
              title: 'Full Stack Engineer',
              company: 'TechCorp Innovation',
              location: 'Hyderabad, India',
              type: 'Full-time',
              salary: '12-15 LPA',
              required_skills: ['Node.js', 'Express', 'React'],
            },
            {
              id: 'opp_demo_3',
              title: 'UI/UX Design Intern',
              company: 'Design Studio',
              location: 'Remote',
              type: 'Internship',
              salary: '₹20,000 / month',
              required_skills: ['Figma', 'Prototyping', 'Design Systems'],
            },
          ]);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, []);

  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="space-y-3 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-xs font-bold uppercase tracking-wider">
              <Briefcase size={14} />
              OPPORTUNITIES
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-950">
              Turn Your Skills Into Real Experience.
            </h2>
            <p className="text-base sm:text-lg text-slate-600">
              Discover opportunities that help you apply what you know and move closer to your career goals.
            </p>
          </div>

          <Link
            to="/opportunities"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/70 border border-blue-200/60 transition-all shrink-0 group"
          >
            <span>View All Opportunities</span>
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* 3 Active Opportunities Preview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {loading
            ? [1, 2, 3].map(i => <SkeletonOpportunityCard key={i} />)
            : opportunities.map(opp => (
                <div
                  key={opp.id}
                  className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-lg hover:border-blue-300 transition-all duration-300 flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    {/* Top Row: Icon + Type Badge */}
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center shadow-xs">
                        <Building size={20} />
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-100">
                        {opp.type}
                      </span>
                    </div>

                    {/* Company & Title */}
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg group-hover:text-blue-600 transition-colors">
                        {opp.title}
                      </h3>
                      <p className="text-sm font-medium text-slate-500 mt-1">{opp.company}</p>
                    </div>

                    {/* Location & Salary */}
                    <div className="flex items-center gap-3 text-xs text-slate-600 pt-1">
                      <span className="flex items-center gap-1">
                        <MapPin size={14} className="text-slate-400" />
                        {opp.location}
                      </span>
                      {opp.salary && (
                        <span className="font-semibold text-slate-900">
                          {opp.salary}
                        </span>
                      )}
                    </div>

                    {/* Required Skills */}
                    {opp.required_skills && opp.required_skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {opp.required_skills.map(sk => (
                          <span key={sk} className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                            {sk}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Apply Button Action */}
                  <div className="pt-6 mt-6 border-t border-slate-100">
                    <Link
                      to="/opportunities"
                      className="w-full py-2.5 rounded-xl font-bold text-xs text-center text-blue-600 bg-slate-50 group-hover:bg-blue-600 group-hover:text-white transition-all flex items-center justify-center gap-1.5"
                    >
                      <span>Apply Now</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              ))}
        </div>

      </div>
    </section>
  );
};

export default OpportunitiesPreview;
