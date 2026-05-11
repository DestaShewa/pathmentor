import { useState } from "react";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import { GlassButton } from "@/components/ui/GlassButton";

const navLinks = [
  { name: "Features", href: "#features" },
  { name: "Roadmap", href: "/roadmap" },
  { name: "Testimonials", href: "#testimonials" },
  { name: "Pricing", href: "#pricing" },
];

export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 px-4 py-4"
    >
      <div className="max-w-7xl mx-auto glass-panel px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/">
            <motion.div
              className="flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
                <span className="text-xl font-bold text-primary-foreground">P</span>
              </div>
              <span className="text-xl font-bold">PathMentor</span>
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/auth?mode=login">
              <GlassButton variant="ghost" size="sm">Sign In</GlassButton>
            </Link>
            <Link to="/auth?mode=register">
              <GlassButton variant="primary" size="sm" glow>Get Started</GlassButton>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <motion.div
        className="md:hidden"
        initial={false}
        animate={{
          opacity: mobileMenuOpen ? 1 : 0,
          pointerEvents: mobileMenuOpen ? "auto" : "none",
        }}
      >
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
        <motion.div
          className="fixed top-20 left-4 right-4 z-50 glass-elevated p-6"
          initial={{ y: -20, opacity: 0 }}
          animate={{
            y: mobileMenuOpen ? 0 : -20,
            opacity: mobileMenuOpen ? 1 : 0,
          }}
        >
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-lg text-muted-foreground hover:text-foreground py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.name}
              </a>
            ))}
            <div className="flex flex-col gap-3 pt-4 border-t border-white/10">
              <Link to="/auth?mode=login" onClick={() => setMobileMenuOpen(false)}>
                <GlassButton variant="ghost" className="w-full">Sign In</GlassButton>
              </Link>
              <Link to="/auth?mode=register" onClick={() => setMobileMenuOpen(false)}>
                <GlassButton variant="primary" glow className="w-full">Get Started</GlassButton>
              </Link>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.nav>
  );
};
