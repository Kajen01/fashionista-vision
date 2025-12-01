import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Award, Heart, Sparkles, Mail, Phone, MapPin } from 'lucide-react';
import TeamSection from '../components/about/TeamSection';
import FAQSection from '../components/about/FAQSection';
import StatsSection from '../components/about/StatsSection';

const About = () => {
  return (
    <div className="pt-16">
      {/* Hero Section */}
      <section className="hero-bg pt-16 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-display font-bold text-gray-900 mb-6"
          >
            Redefining Fashion Excellence
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-600 font-accent mb-8 leading-relaxed"
          >
            At Luxe Fashion, we believe that style is a personal journey. Our mission is to empower
            individuals through curated fashion experiences that blend technology with timeless elegance.
          </motion.p>
        </div>
      </section>

      {/* Brand Story Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="animate-fade-in-up"
            >
              <h2 className="text-4xl font-display font-bold text-gray-900 mb-6">
                Our Story
              </h2>
              <div className="space-y-6 text-gray-600 font-accent text-lg leading-relaxed">
                <p>
                  Founded in 2025, Fashionista Vision emerged from a simple yet powerful vision: to make
                  premium fashion accessible to everyone through innovative technology and personalized styling.
                </p>
                <p>
                  We recognized that traditional online shopping often fails to capture the personal touch
                  and confidence that comes from trying on clothes. Our solution combines cutting-edge
                  AI technology with a curated selection of premium fashion pieces.
                </p>
                <p>
                  Today, we're proud to serve fashion enthusiasts worldwide, offering not just clothing,
                  but a complete styling experience that celebrates individuality and empowers self-expression.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              className="relative"
            >
              <img
                src="https://kimi-web-img.moonshot.cn/img/www.ibizabohogirl.com/9e4c1ea744c2693983afddb73604507e5fd5d107.jpg"
                alt="Our Story"
                className="rounded-2xl shadow-2xl"
              />
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="absolute -bottom-6 -left-6 bg-white p-6 rounded-xl shadow-lg"
              >
                <div className="text-2xl font-bold text-rose-600">50K+</div>
                <div className="text-sm text-gray-600">Happy Customers</div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission & Values */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-display font-bold text-gray-900 mb-4">
              Our Mission & Values
            </h2>
            <p className="text-xl text-gray-600 font-accent">What drives us forward every day</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Sparkles,
                title: 'Innovation',
                description: 'We pioneer the fusion of fashion and technology, constantly pushing boundaries to create revolutionary shopping experiences that inspire and delight.'
              },
              {
                icon: Heart,
                title: 'Inclusivity',
                description: 'Fashion is for everyone. We celebrate diversity in all forms and strive to create experiences that make every individual feel confident and beautiful.'
              },
              {
                icon: Award,
                title: 'Quality',
                description: 'We meticulously curate every piece in our collection, ensuring that quality and craftsmanship meet the highest standards of excellence.'
              }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                className="text-center animate-fade-in-up"
              >
                <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <feature.icon className="w-10 h-10 text-rose-600" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 font-accent leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <StatsSection />

      {/* Technology Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-display font-bold text-gray-900 mb-4">
              Our Technology
            </h2>
            <p className="text-xl text-gray-600 font-accent">Advanced AI meets fashion expertise</p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              {[
                {
                  title: 'AI-Powered Styling',
                  description: 'Our advanced AI analyzes your photos to understand your body type, skin tone, and personal style preferences, providing personalized recommendations.'
                },
                {
                  title: 'Virtual Try-On',
                  description: 'Experience realistic virtual fitting with our cutting-edge technology that overlays clothing on your image, showing how items fit and look from every angle.'
                },
                {
                  title: 'Smart Analytics',
                  description: 'Our platform learns from your preferences and shopping behavior to continuously improve recommendations and predict perfect fits.'
                }
              ].map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.2 }}
                  className="flex items-start space-x-4"
                >
                  <div className="w-12 h-12 bg-rose-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-6 h-6 text-rose-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-gray-600 font-accent">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-2xl p-8"
            >
              <div className="text-center mb-6">
                <h4 className="text-2xl font-display font-bold text-gray-900 mb-2">
                  How Our AI Works
                </h4>
                <p className="text-gray-600 font-accent">A simple 3-step process</p>
              </div>

              <div className="space-y-6">
                {[
                  { step: 1, title: 'Upload Photo', description: 'Take or upload a clear photo of yourself' },
                  { step: 2, title: 'AI Analysis', description: 'Our AI analyzes your features and preferences' },
                  { step: 3, title: 'Get Results', description: 'Receive personalized recommendations' }
                ].map((step) => (
                  <div key={step.step} className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-rose-600 font-bold">{step.step}</span>
                    </div>
                    <div>
                      <h5 className="font-semibold text-gray-900">{step.title}</h5>
                      <p className="text-sm text-gray-600">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <TeamSection />

      {/* FAQ Section */}
      <FAQSection />

      {/* Contact Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h2 className="text-4xl font-display font-bold text-gray-900 mb-6">
              Get In Touch
            </h2>
            <p className="text-xl text-gray-600 font-accent mb-8">
              Have questions or feedback? We'd love to hear from you.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {[
              { icon: Mail, title: 'Email', info: 'hello@fashionistavision.com' },
              { icon: Phone, title: 'Phone', info: '(+94) 74 074 9695' },
              { icon: MapPin, title: 'Address', info: 'Colombo 03, Sri Lanka.' }
            ].map((contact, index) => (
              <motion.div
                key={contact.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <contact.icon className="w-8 h-8 text-rose-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{contact.title}</h3>
                <p className="text-gray-600 font-accent">{contact.info}</p>
              </motion.div>
            ))}
          </div>

          <motion.a
            href="mailto:hello@fashionistavision.com"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-gray-900 text-white px-8 py-4 rounded-full hover:bg-gray-800 transition-colors duration-200 font-semibold"
          >
            Send Us a Message
          </motion.a>
        </div>
      </section>
    </div>
  );
};

export default About;