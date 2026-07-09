"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Cloud, MonitorPlay, MessageSquare, SlidersHorizontal } from 'lucide-react';

const features = [
  {
    icon: <Cloud className="w-6 h-6 text-indigo-400" />,
    title: "The Ultimate Cloud Vault",
    description: "Upload your own audio and local files, and instantly sync them across all devices to listen anywhere & Share them with your friends. Enjoy seamless Playlist Transfers from other platforms.",
    className: "md:col-span-2 lg:col-span-3",
  },
  {
    icon: <MonitorPlay className="w-6 h-6 text-red-400" />,
    title: "True Audio, Clean Visuals",
    description: "Smart Audio-Video Split pulls high-quality audio directly from official releases, while displaying full-screen clean music videos with zero intrusive logos. Gapless crossfading included.",
    className: "md:col-span-2 lg:col-span-3",
  },
  {
    icon: <MessageSquare className="w-6 h-6 text-blue-400" />,
    title: "Built for the Culture",
    description: "Deep Discord integration showcasing live artist info. Lightning-fast lyrics for unreleased tracks, and dedicated spotlight channels.",
    className: "md:col-span-2 lg:col-span-3",
  },
  {
    icon: <SlidersHorizontal className="w-6 h-6 text-emerald-400" />,
    title: "Total Control & Pro UI",
    description: "Advanced queueing, smart recommendations, content labels (Podcast, Song, Video, Quran), a quick explicit content toggle, and custom profile picture uploads.",
    className: "md:col-span-2 lg:col-span-3",
  }
];

export const FeaturesSection = () => {
  return (
    <section className="relative py-24 px-6 bg-[#050505]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">Everything you need. <br className="md:hidden" /><span className="text-zinc-600">Nothing you don't.</span></h2>
          <p className="text-zinc-400 max-w-2xl mx-auto font-medium">A pro-tier experience crafted for those who demand absolute control over their library.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`relative group bg-[#0a0a0a] rounded-3xl p-8 border border-white/5 hover:border-white/10 transition-colors overflow-hidden ${feature.className}`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10 flex flex-col h-full">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-white/10">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-4">{feature.title}</h3>
                <p className="text-zinc-400 leading-relaxed font-medium mt-auto">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
