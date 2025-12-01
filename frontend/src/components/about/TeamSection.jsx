import React from 'react';
import { motion } from 'framer-motion';
import { Linkedin, Twitter, Instagram } from 'lucide-react';

const TeamSection = () => {
  const team = [
    {
      name: "Sarah Chen",
      role: "CEO & Founder",
      image: "https://kimi-web-img.moonshot.cn/img/www.weddingforward.com/b892d9d54b39cf64faeefddc84dd57cae9b3aeab.jpg",
      bio: "Former fashion editor with 15 years of experience in luxury fashion. Passionate about making high-end fashion accessible to everyone.",
      social: { linkedin: "#", twitter: "#", instagram: "#" }
    },
    {
      name: "Marcus Rodriguez",
      role: "CTO",
      image: "https://kimi-web-img.moonshot.cn/img/cdn.stillwhite.com/db3c5085e42d5afb82a3d2316b7072139c411172.jpg",
      bio: "AI and computer vision expert with a PhD from MIT. Leading our technology innovation in virtual fitting and style recommendation.",
      social: { linkedin: "#", twitter: "#", instagram: "#" }
    },
    {
      name: "Emma Thompson",
      role: "Head of Design",
      image: "https://kimi-web-img.moonshot.cn/img/www.ibizabohogirl.com/9e4c1ea744c2693983afddb73604507e5fd5d107.jpg",
      bio: "Award-winning fashion designer and stylist. Curates our collection and ensures every piece meets our quality standards.",
      social: { linkedin: "#", twitter: "#", instagram: "#" }
    }
  ];

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-display font-bold text-gray-900 mb-4">Meet Our Team</h2>
          <p className="text-xl text-gray-600 font-accent">The passionate minds behind Fashionista Vision</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {team.map((member, index) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
              className="team-card text-center bg-white rounded-lg shadow-lg p-6"
            >
              <img
                src={member.image}
                alt={member.name}
                className="w-32 h-32 rounded-full mx-auto mb-6 object-cover"
              />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{member.name}</h3>
              <p className="text-rose-600 font-medium mb-3">{member.role}</p>
              <p className="text-gray-600 font-accent mb-4">{member.bio}</p>
              <div className="flex justify-center space-x-4">
                {Object.entries(member.social).map(([platform, url]) => {
                  const Icon = platform === 'linkedin' ? Linkedin : platform === 'twitter' ? Twitter : Instagram;
                  return (
                    <a
                      key={platform}
                      href={url}
                      className="text-gray-400 hover:text-rose-600 transition-colors"
                    >
                      <Icon className="w-5 h-5" />
                    </a>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TeamSection;