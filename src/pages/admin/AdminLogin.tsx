import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminLogin } from "@/lib/store";
import { toast } from "@/hooks/use-toast";
import { Lock } from "lucide-react";

const AdminLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminLogin(username, password)) {
      navigate("/bestadmin/dashboard");
    } else {
      toast({ title: "Invalid credentials", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-hero flex items-center justify-center">
      <div className="bg-card rounded-lg shadow-lg p-8 w-full max-w-sm animate-fade-in">
        <div className="text-center mb-6">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <h1 className="font-heading text-2xl font-bold">Admin Login</h1>
          <p className="text-sm text-muted-foreground mt-1">CareHomeStaffUK Management</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label htmlFor="username">Username</Label>
            <Input id="username" value={username} onChange={e => setUsername(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full bg-primary text-primary-foreground">Sign In</Button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
