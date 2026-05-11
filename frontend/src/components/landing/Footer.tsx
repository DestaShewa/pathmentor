import { motion } from "framer-motion";
import { Github, Twitter, Linkedin, Mail } from "lucide-react";

const footerLinks = {
  product: ["Features", "Pricing", "Roadmap", "API"],
  company: ["About", "Blog", "Careers", "Press"],
  resources: ["Documentation", "Help Center", "Community", "Tutorials"],
  legal: ["Privacy", "Terms", "Security", "Cookies"],
};

const socialLinks = [
  { icon: Twitter, href: "#" },
  { icon: Github, href: "#" },
  { icon: Linkedin, href: "#" },
  { icon: Mail, href: "#" },
];

export const Footer = () => {
  return (
    <footer className="relative py-16 px-4 border-t border-white/10">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
                <span className="text-xl font-bold text-primary-foreground">P</span>
              </div>
              <span className="text-xl font-bold">PathMentor</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Transform your learning journey with AI-powered guidance.
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social, index) => (
                <motion.a
                  key={index}
                  href={social.href}
                  className="w-10 h-10 rounded-lg glass-inner-glow flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <social.icon className="w-5 h-5" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="font-semibold mb-4 capitalize">{category}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} PathMentor AI. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
