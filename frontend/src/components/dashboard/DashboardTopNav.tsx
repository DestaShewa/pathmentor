import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { User, Menu, Sparkles, Settings, Save, Camera, X, LogOut } from "lucide-react";
import { useState, useRef } from "react";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface DashboardTopNavProps {
  userName: string;
  userEmail: string;
  onSignOut: () => void;
  onMenuToggle: () => void;
}

export const DashboardTopNav = ({
  userName,
  userEmail,
  onSignOut,
  onMenuToggle,
}: DashboardTopNavProps) => {
  const [aiActive] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Profile State
  const [editName, setEditName] = useState(userName);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Handle Image Upload Logic
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      console.log("Profile Saved:", { name: editName, image: profileImage });
    }, 1000);
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 px-4 py-3"
    >
      <div className="glass-premium flex items-center justify-between px-4 md:px-6 py-3">
        {/* Left: Menu + Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-xl hover:bg-foreground/10 transition-colors"
          >
            <Menu className="w-5 h-5 text-foreground" />
          </button>
          
          <Link to="/" className="flex items-center gap-3">
            <motion.div
              className="w-10 h-10 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-lg"
              whileHover={{ scale: 1.05, rotate: 5 }}
            >
              <span className="text-lg font-bold text-primary-foreground">P</span>
            </motion.div>
            <span className="text-lg font-semibold hidden sm:block text-foreground">PathMentor AI</span>
          </Link>
        </div>

        {/* Right: AI Status, Notifications, User */}
        <div className="flex items-center gap-2 md:gap-4">
          <motion.div
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-foreground/5 border border-foreground/10"
          >
            <div className={`w-2 h-2 rounded-full ${aiActive ? "bg-teal ai-status-glow" : "bg-muted-foreground"}`} />
            <span className="text-xs text-muted-foreground">AI Active</span>
          </motion.div>

          <NotificationBell />

          {/* User Avatar Dropdown & Modal Wrapper */}
          <Dialog>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.button
                  className="flex items-center gap-2 p-1.5 pr-3 rounded-xl hover:bg-foreground/10 transition-colors"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="w-8 h-8 rounded-xl bg-gradient-secondary overflow-hidden flex items-center justify-center border border-foreground/10">
                    {profileImage ? (
                      <img src={profileImage} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-4 h-4 text-secondary-foreground" />
                    )}
                  </div>
                  <span className="hidden md:block text-sm font-medium text-foreground max-w-[120px] truncate">
                    {userName}
                  </span>
                </motion.button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 glass-premium border-foreground/20 text-foreground">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium">{userName}</p>
                  <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
                </div>
                
                <DropdownMenuSeparator className="bg-foreground/10" />
                
                {/* Modal Trigger */}
                <DialogTrigger asChild>
                  <DropdownMenuItem className="cursor-pointer flex items-center gap-2">
                    <Settings className="w-4 h-4" /> Edit Profile
                  </DropdownMenuItem>
                </DialogTrigger>
               
                <DropdownMenuSeparator className="bg-foreground/10" />
                <DropdownMenuItem onClick={onSignOut} className="text-destructive focus:text-destructive cursor-pointer flex items-center gap-2">
                  <LogOut className="w-4 h-4" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Edit Profile Pop-up */}
            <DialogContent className="glass-premium border-foreground/20 text-foreground sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-foreground">
                  <Settings className="w-5 h-5 text-teal" /> Edit Profile
                </DialogTitle>
              </DialogHeader>

              <div className="grid gap-6 py-6">
                {/* Photo Upload Section */}
                <div className="flex flex-col items-center gap-4">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-3xl bg-gradient-secondary overflow-hidden border-2 border-foreground/20 flex items-center justify-center shadow-2xl">
                      {profileImage ? (
                        <img src={profileImage} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-10 h-10 text-secondary-foreground" />
                      )}
                    </div>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl cursor-pointer"
                    >
                      <Camera className="w-6 h-6 text-white" />
                    </button>
                    {profileImage && (
                      <button 
                        onClick={() => setProfileImage(null)}
                        className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1.5 shadow-lg hover:scale-110 transition-transform"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
                  <p className="text-[11px] text-muted-foreground">Square photos work best</p>
                </div>

                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Full Name</Label>
                    <Input id="name" value={editName} onChange={(e) => setEditName(e.target.value)} className="bg-foreground/5 border-foreground/10 focus:border-teal text-foreground" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Email</Label>
                    <Input id="email" value={userEmail} disabled className="bg-foreground/5 border-foreground/10 opacity-50 cursor-not-allowed" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button 
                  onClick={handleSaveProfile} 
                  disabled={isSaving}
                  className="bg-gradient-primary text-primary-foreground font-semibold px-8 flex gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </motion.header>
  );
};