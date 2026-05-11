import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Software Engineer at Google",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    content: "PathMentor AI transformed my career. The personalized roadmap helped me go from junior to senior engineer in just 18 months.",
    rating: 5,
  },
  {
    name: "Marcus Johnson",
    role: "Data Scientist",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    content: "The AI-powered recommendations are incredibly accurate. It knew exactly what I needed to learn next to advance my skills.",
    rating: 5,
  },
  {
    name: "Emily Rodriguez",
    role: "UX Designer at Meta",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    content: "The mentorship feature connected me with amazing industry experts who provided invaluable guidance throughout my journey.",
    rating: 5,
  },
];

export const TestimonialsSection = () => {
  return (
    <section id="testimonials" className="relative py-24 md:py-32 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-inner-glow mb-6">
            <Quote className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Success Stories</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Loved by <span className="text-gradient">Thousands</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join the community of learners who have transformed their careers with PathMentor AI.
          </p>
        </motion.div>

        {/* Testimonials grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <GlassCard className="p-6 h-full flex flex-col">
                {/* Quote icon */}
                <Quote className="w-8 h-8 text-primary/40 mb-4" />

                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>

                {/* Content */}
                <p className="text-muted-foreground flex-grow mb-6">
                  "{testimonial.content}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
